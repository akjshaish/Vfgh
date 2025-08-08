
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { Invoice } from '@/app/dashboard/billing/page';

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true);
                const invoicesRef = ref(db, 'invoices');
                const snapshot = await get(invoicesRef);
                if (snapshot.exists()) {
                    const invoicesData = snapshot.val();
                    const allInvoices: Invoice[] = Object.keys(invoicesData).map(key => ({
                        id: key,
                        ...invoicesData[key]
                    }));
                    allInvoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
                    setInvoices(allInvoices);
                } else {
                    setInvoices([]);
                }
            } catch (err) {
                setError('Failed to fetch invoices. Please check your database connection.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const getStatusVariant = (status: Invoice['status']) => {
        return status === 'Paid' ? 'default' : 'destructive';
    };
    
    const downloadAllInvoices = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(invoices, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `all_invoices_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">All Invoices</h1>
                    <p className="text-sm text-muted-foreground">
                        A record of all invoices generated on the platform.
                    </p>
                </div>
                 <Button onClick={downloadAllInvoices} disabled={invoices.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Download All (.json)
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>An overview of all customer invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono text-xs">{invoice.id.substring(invoice.id.length - 8).toUpperCase()}</TableCell>
                                        <TableCell className="font-medium">{invoice.userEmail}</TableCell>
                                        <TableCell>{invoice.serviceName}</TableCell>
                                        <TableCell>₹{invoice.amount.toFixed(2)}</TableCell>
                                        <TableCell>{format(new Date(invoice.invoiceDate), 'PPP')}</TableCell>
                                        <TableCell>
                                             <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/invoice/${invoice.id}`} target="_blank">
                                                    <Eye className="mr-2 h-4 w-4" /> View Invoice
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No invoices found.
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
