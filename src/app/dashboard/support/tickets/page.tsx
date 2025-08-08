
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export interface Ticket {
    id: string;
    ticketTitle: string;
    status: 'Open' | 'In Progress' | 'Answered' | 'Closed';
    createdAt: string;
}

export default function UserTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { userId } = useAuth();

    useEffect(() => {
        if (!userId) {
            if (!userId && loading) setLoading(false);
            return;
        };

        const fetchTickets = async () => {
            setLoading(true);
            try {
                const ticketsQuery = query(ref(db, 'tickets'), orderByChild('userId'), equalTo(userId));
                const snapshot = await get(ticketsQuery);
                if (snapshot.exists()) {
                    const ticketsData = snapshot.val();
                    const ticketsArray = Object.keys(ticketsData).map(key => ({
                        id: key,
                        ...ticketsData[key]
                    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setTickets(ticketsArray);
                } else {
                    setTickets([]);
                }
            } catch (err) {
                setError('Failed to fetch tickets. Please check your database connection.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [userId]);

    const getStatusVariant = (status: Ticket['status']): 'default' | 'secondary' | 'outline' => {
        switch (status) {
            case 'Open': return 'default';
            case 'In Progress': return 'secondary';
            case 'Answered': return 'secondary';
            case 'Closed': return 'outline';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Support Tickets</h1>
                    <p className="text-sm text-muted-foreground">
                        Track the status of your support requests.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/dashboard/support">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Open New Ticket
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Your Tickets</CardTitle>
                    <CardDescription>A list of your submitted tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : tickets.length > 0 ? (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/support/tickets/${ticket.id}`)}>
                                        <TableCell className="font-medium">{ticket.ticketTitle}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(ticket.status)}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        You haven't submitted any tickets yet.
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
