
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, LogIn, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Subdomain {
    id: string;
    subdomain: string;
    createdAt: string;
    userId: string;
    status: 'Active' | 'Pending Activation'; // Status remains for display
    serviceId: string;
}

interface SubdomainListProps {
    userId: string;
}

export function SubdomainList({ userId }: SubdomainListProps) {
    const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchSubdomains = async () => {
            setLoading(true);
             try {
                const subdomainsRef = ref(db, 'subdomains');
                const subdomainsQuery = query(subdomainsRef, orderByChild('userId'), equalTo(userId));
                const snapshot = await get(subdomainsQuery);
    
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const list = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setSubdomains(list);
                } else {
                    setSubdomains([]);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load your subdomains. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchSubdomains();
    }, [userId]);
    

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive">{error}</p>;
    }

    return (
        <div>
            {subdomains.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subdomain</TableHead>
                            <TableHead>Registered On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subdomains.map(sub => (
                            <TableRow key={sub.id}>
                                <TableCell className="font-medium">
                                    <a 
                                        href={`http://${sub.subdomain}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-2"
                                    >
                                        <Globe className="h-4 w-4" />
                                        {sub.subdomain}
                                    </a>
                                </TableCell>
                                <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={sub.status === 'Active' ? 'default' : 'secondary'}>
                                        {sub.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/services/${sub.serviceId}`)}>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Manage
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-muted-foreground text-sm">You have no subdomains yet.</p>
            )}
        </div>
    )
}
