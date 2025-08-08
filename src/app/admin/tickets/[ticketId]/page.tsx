
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Shield, MessageSquare, Loader2 } from 'lucide-react';
import { updateTicketStatus, postReply } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Status = 'Open' | 'In Progress' | 'Answered' | 'Closed';

interface Reply {
    author: 'user' | 'admin';
    authorName: string;
    message: string;
    timestamp: string;
}

interface TicketDetails {
    id: string;
    ticketTitle: string;
    ticketDescription: string;
    userEmail: string;
    userId: string;
    priorityScore: number;
    status: Status;
    createdAt: string;
    replies?: { [key: string]: Reply };
}

export default function ManageTicketPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = typeof params.ticketId === 'string' ? params.ticketId : '';
    const { toast } = useToast();

    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchTicket = async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const ticketRef = ref(db, `tickets/${ticketId}`);
            const snapshot = await get(ticketRef);
            if (snapshot.exists()) {
                setTicket({ id: snapshot.key, ...snapshot.val() });
            } else {
                setError("Ticket not found.");
            }
        } catch (e) {
            setError("Failed to fetch ticket details.");
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const handleStatusChange = async (newStatus: Status) => {
        setIsSubmitting(true);
        try {
            await updateTicketStatus(ticketId, newStatus);
            setTicket(prev => prev ? { ...prev, status: newStatus } : null);
            toast({ title: 'Success', description: `Ticket status updated to ${newStatus}.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await postReply(ticketId, replyText, 'admin', 'Admin');
            setReplyText('');
            toast({ title: 'Success', description: 'Your reply has been posted.' });
            fetchTicket(); // Re-fetch to get the latest replies
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to post reply.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getPriority = (score: number): { text: 'Low' | 'Medium' | 'High', variant: 'secondary' | 'default' | 'destructive' } => {
        if (score <= 4) return { text: 'Low', variant: 'secondary' };
        if (score <= 7) return { text: 'Medium', variant: 'default' };
        return { text: 'High', variant: 'destructive' };
    };

    const ticketReplies = ticket?.replies ? Object.values(ticket.replies).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

    if (loading) return <Skeleton className="h-96 w-full" />;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!ticket) return null;

    return (
        <div className="space-y-8">
             <div>
                <Button variant="ghost" onClick={() => router.push('/admin/tickets')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Tickets
                </Button>
                <h1 className="text-3xl font-bold font-headline">{ticket.ticketTitle}</h1>
                <p className="text-sm text-muted-foreground">
                    From: {ticket.userEmail}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="whitespace-pre-wrap">{ticket.ticketDescription}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {ticketReplies.length > 0 ? ticketReplies.map((reply, index) => (
                                <div key={index} className={`flex items-start gap-4 ${reply.author === 'admin' ? 'justify-end' : ''}`}>
                                    {reply.author === 'user' && <div className="p-2 rounded-full bg-secondary"><User className="h-5 w-5" /></div>}
                                    <div className={`p-4 rounded-lg max-w-[80%] ${reply.author === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="font-bold text-sm">{reply.authorName}</p>
                                        <p className="text-sm">{reply.message}</p>
                                        <p className="text-xs opacity-70 mt-2">{new Date(reply.timestamp).toLocaleString()}</p>
                                    </div>
                                    {reply.author === 'admin' && <div className="p-2 rounded-full bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></div>}
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No replies yet.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Post a Reply
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your response here..."
                                rows={5}
                                disabled={isSubmitting || ticket.status === 'Closed'}
                            />
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleReplySubmit} disabled={isSubmitting || !replyText.trim() || ticket.status === 'Closed'}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Reply
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                 <Select value={ticket.status} onValueChange={handleStatusChange} disabled={isSubmitting}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Change status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Answered">Answered</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Priority</span>
                                <Badge variant={getPriority(ticket.priorityScore).variant}>{getPriority(ticket.priorityScore).text}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    