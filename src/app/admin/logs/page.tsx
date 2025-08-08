
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clearAuthLogs } from '@/lib/actions';
import { Download, Loader2, Eye, EyeOff } from 'lucide-react';

export interface AuthLog {
    id: string;
    email: string;
    ip: string;
    action: 'Login' | 'Register';
    timestamp: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<AuthLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const [showIps, setShowIps] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const logsRef = ref(db, 'auth_logs');
            const snapshot = await get(logsRef);
            if (snapshot.exists()) {
                const logsData = snapshot.val();
                const logsArray = Object.keys(logsData).map(key => ({
                    id: key,
                    ...logsData[key]
                })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setLogs(logsArray);
            } else {
                setLogs([]);
            }
        } catch (err) {
            setError('Failed to fetch logs. Please check your database connection and rules.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchLogs();
    }, []);

    const handleClearLogs = async () => {
        if (!logs.length) {
            toast({
                variant: 'destructive',
                title: 'No logs to clear.',
            });
            return;
        }

        setIsClearing(true);

        try {
            // 1. Download logs as JSON
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(logs, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `auth_logs_${new Date().toISOString()}.json`;
            link.click();

            toast({
                title: 'Success',
                description: 'Logs downloaded. Now clearing from database...',
            });

            // 2. Clear logs from DB
            await clearAuthLogs();

            // 3. Refresh local state
            setLogs([]);
            
             toast({
                title: 'Success',
                description: 'Authentication logs have been cleared.',
            });

        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to clear logs. Please try again.",
            });
        } finally {
            setIsClearing(false);
        }
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Authentication Logs</h1>
                <p className="text-sm text-muted-foreground">
                    A record of user login and registration events.
                </p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Recent Events</CardTitle>
                        <CardDescription>An overview of recent authentication activities.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowIps(!showIps)}>
                        {showIps ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {showIps ? 'Hide IPs' : 'Show IPs'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length > 0 ? (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.action === 'Login' ? 'default' : 'secondary'}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {showIps ? log.ip : '••••••••'}
                                        </TableCell>
                                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No authentication logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleClearLogs} disabled={isClearing || !logs.length} variant="destructive">
                        {isClearing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isClearing ? 'Processing...' : 'Download & Clear Logs'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
