
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Shield, Send, MessageSquare } from 'lucide-react';
import { postReply } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';

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
    status: Status;
    createdAt: string;
    replies?: { [key: string]: Reply };
}

export default function ViewTicketPage() {
    const params = useParams();
    const router = useRouter();
    const { userId, userEmail } = useAuth();
    const ticketId = typeof params.ticketId === 'string' ? params.ticketId : '';
    const { toast } = useToast();
    const repliesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const fetchTicket = async () => {
        if (!ticketId || !userId) return;
        setLoading(true);
        try {
            const ticketRef = ref(db, `tickets/${ticketId}`);
            const snapshot = await get(ticketRef);
            if (snapshot.exists()) {
                const ticketData = snapshot.val();
                if(ticketData.userId !== userId) {
                    setError("You do not have permission to view this ticket.");
                } else {
                    setTicket({ id: snapshot.key, ...ticketData });
                }
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
    }, [ticketId, userId]);

    useEffect(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.replies]);

    const handleReplySubmit = async () => {
        if (!replyText.trim() || !userEmail) return;
        setIsSubmitting(true);
        try {
            await postReply(ticketId, replyText, 'user', userEmail);
            setReplyText('');
            toast({ title: 'Success', description: 'Your reply has been posted.' });
            fetchTicket(); // Re-fetch to get the latest replies
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to post reply.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const ticketReplies = ticket?.replies ? Object.values(ticket.replies).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];
    
    const getStatusVariant = (status: Status): 'default' | 'secondary' | 'outline' => {
        switch (status) {
            case 'Open': return 'default';
            case 'In Progress': return 'secondary';
            case 'Answered': return 'secondary';
            case 'Closed': return 'outline';
            default: return 'outline';
        }
    }

    if (loading) return <Skeleton className="h-96 w-full" />;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!ticket) return null;

    return (
        <div className="space-y-8">
             <div>
                <Button variant="ghost" onClick={() => router.push('/dashboard/support/tickets')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Tickets
                </Button>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-headline">{ticket.ticketTitle}</h1>
                    <Badge variant={getStatusVariant(ticket.status)} className="text-base px-4 py-1">{ticket.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Ticket opened on {new Date(ticket.createdAt).toLocaleString()}
                </p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="p-4 rounded-lg bg-muted">
                        <p className="font-bold text-sm">{ticket.userEmail} (You)</p>
                        <p className="text-sm whitespace-pre-wrap">{ticket.ticketDescription}</p>
                         <p className="text-xs opacity-70 mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>

                    {ticketReplies.map((reply, index) => (
                        <div key={index} className={`flex items-start gap-4 ${reply.author === 'user' ? 'justify-end' : ''}`}>
                            {reply.author === 'admin' && <div className="p-2 rounded-full bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></div>}
                            <div className={`p-4 rounded-lg max-w-[80%] ${reply.author === 'user' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                                <p className="font-bold text-sm">{reply.authorName}</p>
                                <p className="text-sm">{reply.message}</p>
                                <p className="text-xs opacity-70 mt-2">{new Date(reply.timestamp).toLocaleString()}</p>
                            </div>
                            {reply.author === 'user' && <div className="p-2 rounded-full bg-secondary"><User className="h-5 w-5" /></div>}
                        </div>
                    ))}
                    <div ref={repliesEndRef} />
                </CardContent>
            </Card>

            {ticket.status !== 'Closed' && (
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
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end mt-4">
                             <Button onClick={handleReplySubmit} disabled={isSubmitting || !replyText.trim()}>
                                {isSubmitting && <Send className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reply
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
