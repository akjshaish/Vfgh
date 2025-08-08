
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, Bot, Trash, Eye, Inbox, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { clearAllTickets, bulkAutoReply } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface Ticket {
    id: string;
    ticketTitle: string;
    userEmail: string;
    priorityScore: number;
    status: 'Open' | 'In Progress' | 'Answered' | 'Closed';
    createdAt: string;
}

const TicketTable = ({ tickets, loading, onRowClick }: { tickets: Ticket[], loading: boolean, onRowClick: (id: string) => void }) => {
    
    const getPriority = (score: number): { text: 'Low' | 'Medium' | 'High', variant: 'secondary' | 'default' | 'destructive' } => {
        if (score <= 4) return { text: 'Low', variant: 'secondary' };
        if (score <= 7) return { text: 'Medium', variant: 'default' };
        return { text: 'High', variant: 'destructive' };
    };

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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : tickets.length > 0 ? (
                    tickets.map((ticket) => {
                        const priority = getPriority(ticket.priorityScore);
                        return (
                            <TableRow key={ticket.id} className="cursor-pointer" onClick={() => onRowClick(ticket.id)}>
                                <TableCell className="font-medium">{ticket.ticketTitle}</TableCell>
                                <TableCell>
                                    <Badge variant={priority.variant}>
                                        {priority.text}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(ticket.status)}>
                                        {ticket.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRowClick(ticket.id); }}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No tickets in this category.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}


export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const ticketsRef = ref(db, 'tickets');
            const snapshot = await get(ticketsRef);
            if (snapshot.exists()) {
                const ticketsData = snapshot.val();
                const ticketsArray = Object.keys(ticketsData).map(key => ({
                    id: key,
                    ...ticketsData[key]
                })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setTickets(ticketsArray);
            } else {
                setTickets([]);
            }
        } catch (err) {
            setError('Failed to fetch tickets. Please check your database connection and rules.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleBulkAction = async (action: 'clear' | 'reply') => {
        setIsProcessing(true);
        try {
            if (action === 'clear') {
                await clearAllTickets();
                toast({ title: 'Success', description: 'All tickets have been cleared.' });
            } else {
                await bulkAutoReply();
                toast({ title: 'Success', description: 'Auto-replies sent to all open tickets.' });
            }
            fetchTickets(); // Refresh the list
        } catch (e) {
            const error = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Error', description: error });
        } finally {
            setIsProcessing(false);
        }
    }

    const handleRowClick = (id: string) => {
        router.push(`/admin/tickets/${id}`);
    }

    const pendingTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
    const answeredTickets = tickets.filter(t => t.status === 'Answered' || t.status === 'Closed');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Support Tickets</h1>
                <p className="text-sm text-muted-foreground">
                    Manage and respond to user support tickets.
                </p>
            </div>
            
            {error && <p className="text-destructive">{error}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Inbox /> Pending Tickets
                        </CardTitle>
                        <CardDescription>Tickets that require your attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TicketTable tickets={pendingTickets} loading={loading} onRowClick={handleRowClick} />
                    </CardContent>
                     <CardFooter className="justify-end space-x-2">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" disabled={isProcessing || pendingTickets.length === 0}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                    Bulk Auto-Reply
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Auto-Reply</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will send "Your problem will be solved within a few days." to all Open and In Progress tickets and set their status to Answered. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleBulkAction('reply')} disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm & Send
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="destructive" disabled={isProcessing || tickets.length === 0}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                                    Clear All Tickets
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all tickets from the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleBulkAction('clear')} disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle /> Answered & Closed
                        </CardTitle>
                        <CardDescription>A list of all resolved tickets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TicketTable tickets={answeredTickets} loading={loading} onRowClick={handleRowClick} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
