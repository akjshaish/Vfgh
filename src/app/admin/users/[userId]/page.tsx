
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, Server, Globe, DollarSign, ArrowLeft, Shield } from 'lucide-react';
import type { Order } from '../../orders/page';

interface UserDetails {
    id: string;
    email: string;
    createdAt: string;
    status: 'Active' | 'Suspended' | 'Banned' | 'Terminated';
    ip?: string;
}

interface Subdomain {
    id: string;
    subdomain: string;
    createdAt: string;
}

export default function ManageUserPage() {
    const params = useParams();
    const router = useRouter();
    const userId = typeof params.userId === 'string' ? params.userId : '';

    const [user, setUser] = useState<UserDetails | null>(null);
    const [services, setServices] = useState<Order[]>([]);
    const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setError("User ID is missing.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch User Details
                const userRef = ref(db, `users/${userId}`);
                const userSnap = await get(userRef);
                if (!userSnap.exists()) {
                   throw new Error("User not found.");
                }
                
                const userData = { id: userSnap.key, ...userSnap.val() };

                // Fetch User Services (already part of user object, but let's structure it)
                const userServices = userSnap.val().services || {};
                const servicesArray = Object.keys(userServices).map(key => ({
                    id: key, // The service key is the unique ID
                    userId: userId,
                    userEmail: userSnap.val().email,
                    ...userServices[key]
                }));
                setServices(servicesArray);

                // Fetch User Subdomains
                const subdomainsQuery = query(ref(db, 'subdomains'), orderByChild('userId'), equalTo(userId));
                const subdomainsSnap = await get(subdomainsQuery);
                if (subdomainsSnap.exists()) {
                     const subdomainsData = subdomainsSnap.val();
                     const subdomainsArray = Object.keys(subdomainsData).map(key => ({
                        id: key,
                        ...subdomainsData[key]
                    }));
                    setSubdomains(subdomainsArray);
                }

                // Fetch Auth Logs for IP
                const logsQuery = query(ref(db, 'auth_logs'), orderByChild('email'), equalTo(userData.email));
                const logsSnap = await get(logsQuery);
                if (logsSnap.exists()) {
                    const logsData = logsSnap.val();
                    const latestLog = Object.values(logsData).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as any;
                    userData.ip = latestLog?.ip || 'Not Found';
                }
                
                setUser(userData);


            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [userId]);

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Suspended': return 'secondary';
            case 'Terminated': return 'outline';
            case 'Banned': return 'destructive';
            case 'Pending': return 'secondary';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-64" />
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-destructive bg-destructive/10 p-4 rounded-md">
                <h2 className="font-bold">Error</h2>
                <p>{error}</p>
                 <Button variant="link" onClick={() => router.push('/admin/users')}>Go back to users</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
             <div>
                <Button variant="ghost" onClick={() => router.push('/admin/users')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Users
                </Button>
                <h1 className="text-3xl font-bold font-headline">User Details</h1>
                <p className="text-sm text-muted-foreground">
                    Managing user: {user?.email}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{user?.email}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{user?.ip || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Joined on {user ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={user?.status === 'Active' ? 'default' : 'destructive'}>{user?.status || 'Active'}</Badge>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>List of services ordered by this user.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Linked Domain</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.length > 0 ? (
                                services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>₹{service.price.toFixed(2)}</TableCell>
                                        <TableCell className="font-mono text-primary">{service.subdomain || 'Not Linked'}</TableCell>
                                        <TableCell>{new Date(service.orderDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                             <Badge variant={getStatusVariant(service.status)}>{service.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No services found for this user.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Registered Subdomains</CardTitle>
                    <CardDescription>List of all subdomains registered by this user.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subdomain</TableHead>
                                <TableHead>Registered On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subdomains.length > 0 ? (
                                subdomains.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium font-mono text-primary">{sub.subdomain}</TableCell>
                                        <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24">
                                        No subdomains found for this user.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
