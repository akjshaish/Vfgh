
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { CreditCard, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export interface Invoice {
    id: string;
    serviceId: string;
    serviceName: string;
    userId: string;
    amount: number;
    status: 'Paid' | 'Unpaid';
    invoiceDate: string;
    dueDate: string;
}

export default function BillingPage() {
    const { userId, loading: authLoading } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !userId) {
            if (!authLoading) setLoading(false);
            return;
        }

        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const invoicesQuery = query(ref(db, 'invoices'), orderByChild('userId'), equalTo(userId));
                const snapshot = await get(invoicesQuery);
                if (snapshot.exists()) {
                    const invoicesData = snapshot.val();
                    const userInvoices = Object.keys(invoicesData).map((key): Invoice => ({
                        id: key,
                        ...invoicesData[key],
                    }));
                    userInvoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
                    setInvoices(userInvoices);
                }
            } catch (error) {
                console.error("Failed to fetch billing data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();

    }, [userId, authLoading]);

    const stats = {
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(inv => inv.status === 'Paid').length,
        unpaidInvoices: invoices.filter(inv => inv.status === 'Unpaid').length,
    };

    if (loading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Billing</h1>
                <p className="text-sm text-muted-foreground">
                    View your invoices and manage payment methods.
                </p>
            </div>

             <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.paidInvoices}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unpaidInvoices}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>
                        A record of all your service payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-mono text-xs">{invoice.id.substring(invoice.id.length - 8).toUpperCase()}</TableCell>
                                    <TableCell className="font-medium">{invoice.serviceName}</TableCell>
                                    <TableCell>{format(new Date(invoice.invoiceDate), 'PPP')}</TableCell>
                                    <TableCell>₹{invoice.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {invoice.status === 'Unpaid' ? (
                                            <Button variant="secondary" size="sm" asChild>
                                                <Link href={`/dashboard/order/${invoice.serviceId}`}>
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    Pay Now
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/invoice/${invoice.id}`} target="_blank">
                                                   <Eye className="mr-2 h-4 w-4" /> View
                                                </Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        You have no invoices yet.
                                         <Button variant="link" asChild className="ml-2">
                                            <Link href="/dashboard/order">
                                                Order a service to get started
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
