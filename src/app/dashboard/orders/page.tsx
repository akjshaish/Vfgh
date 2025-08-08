
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Plan } from '../plans/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, PlayCircle, PauseCircle, XCircle, Ban, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateServiceStatus } from '@/lib/actions';


export interface Order extends Plan {
    orderId: string;
    userId: string;
    userEmail: string;
    orderDate: string;
    status: 'Active' | 'Suspended' | 'Terminated' | 'Banned' | 'Pending';
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const allOrders: Order[] = [];
                for (const userId in usersData) {
                    const user = usersData[userId];
                    if (user.services) {
                        for (const serviceId in user.services) {
                            const service = user.services[serviceId];
                            allOrders.push({
                                ...service,
                                // The orderId is now a field within the service object
                                orderId: service.orderId,
                                userId: userId,
                                userEmail: user.email,
                            });
                        }
                    }
                }
                // Sort orders by date, newest first
                allOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setOrders(allOrders);
            } else {
                setOrders([]);
            }
        } catch (err) {
            setError('Failed to fetch orders. Please check your database connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: 'Order ID copied to clipboard.' });
    };

    const handleUpdateStatus = async (userId: string, orderId: string, status: Order['status']) => {
        setUpdatingOrderId(orderId);
        try {
            await updateServiceStatus(userId, orderId, status);
            toast({
                title: "Success",
                description: `Order status has been updated to ${status}.`,
            });
            // Update local state to reflect change immediately
            setOrders(orders.map(order => order.orderId === orderId ? { ...order, status } : order));
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update order status.",
            });
        } finally {
            setUpdatingOrderId(null);
        }
    };

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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">All Orders</h1>
                <p className="text-sm text-muted-foreground">
                    A list of all services ordered by users.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>An overview of all customer orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <TableRow key={order.orderId}>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1">
                                                <span>{order.orderId.substring(order.orderId.length - 6)}</span>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(order.orderId)}>
                                                    <ClipboardCopy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{order.userEmail}</TableCell>
                                        <TableCell>{order.name}</TableCell>
                                        <TableCell>₹{order.price.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                             <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {updatingOrderId === order.orderId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.userId, order.orderId, 'Active')}>
                                                        <PlayCircle className="mr-2 h-4 w-4" /> Activate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.userId, order.orderId, 'Suspended')}>
                                                        <PauseCircle className="mr-2 h-4 w-4" /> Suspend
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.userId, order.orderId, 'Terminated')}>
                                                        <XCircle className="mr-2 h-4 w-4" /> Terminate/Cancel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(order.userId, order.orderId, 'Banned')}>
                                                        <Ban className="mr-2 h-4 w-4" /> Ban Service
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No orders found.
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
