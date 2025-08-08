
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Invoice as InvoiceData } from '@/app/dashboard/billing/page';

const InvoicePageContent = () => {
    const params = useParams();
    const router = useRouter();
    const { userId, loading: authLoading } = useAuth();
    const invoiceId = typeof params.invoiceId === 'string' ? params.invoiceId : '';

    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!invoiceId) {
            setError("Invoice ID is missing from the URL.");
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const invoiceRef = ref(db, `invoices/${invoiceId}`);
                const snapshot = await get(invoiceRef);
                if (snapshot.exists()) {
                    const invoiceData = { id: snapshot.key, ...snapshot.val() };
                    // Security check: Ensure the logged-in user owns this invoice or is an admin.
                    const userIsAdmin = localStorage.getItem('userEmail') === 'admin@razorhost.xyz';

                    if (userId === invoiceData.userId || userIsAdmin) {
                        setInvoice(invoiceData);
                    } else {
                         setError("You do not have permission to view this invoice.");
                    }
                } else {
                    setError("Invoice not found.");
                }
            } catch (e) {
                console.error(e);
                setError("Failed to fetch invoice data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [invoiceId, userId, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
                <Skeleton className="h-16 w-1/3" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center py-12 text-destructive font-semibold">{error}</div>
    }

    if (!invoice) {
        return null;
    }
    
    const { companyDetails, userDetails } = invoice;

    return (
        <div className="bg-background text-foreground min-h-screen">
             <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                     <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
                    </Button>
                </div>
                <div className="p-8 border rounded-lg bg-card">
                    <header className="flex justify-between items-start pb-6 border-b">
                        <div>
                            <h1 className="text-2xl font-bold">{companyDetails?.companyName || 'N/A'}</h1>
                            <p>{companyDetails?.address || 'N/A'}</p>
                            <p>{companyDetails?.city || 'N/A'}, {companyDetails?.postalCode || 'N/A'}</p>
                            <p>{companyDetails?.country || 'N/A'}</p>
                             {companyDetails?.taxId && <p>Tax ID: {companyDetails.taxId}</p>}
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase text-muted-foreground">Invoice</h2>
                            <p className="font-mono text-sm"># {invoice.id.substring(invoice.id.length - 8).toUpperCase()}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold mb-2">Bill To:</h3>
                            <p>{userDetails?.name || userDetails?.email || 'N/A'}</p>
                            <p>{userDetails?.email || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                             <div className="grid grid-cols-2">
                                <span className="font-semibold">Invoice Date:</span>
                                <span>{format(new Date(invoice.invoiceDate), 'PPP')}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-semibold">Due Date:</span>
                                <span>{format(new Date(invoice.dueDate), 'PPP')}</span>
                            </div>
                             <div className="grid grid-cols-2 mt-2">
                                <span className="font-semibold">Status:</span>
                                <Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className="justify-self-end">
                                    {invoice.status}
                                </Badge>
                            </div>
                        </div>
                    </section>

                    <section>
                        <table className="w-full">
                           <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 font-semibold">Description</th>
                                    <th className="text-right py-2 font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-4">
                                        <p className="font-medium">{invoice.serviceName}</p>
                                        <p className="text-muted-foreground text-xs">Service Period: Monthly</p>
                                    </td>
                                    <td className="text-right font-medium">₹{invoice.amount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                    
                    <section className="mt-8 pt-6 border-t flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                             <div className="flex justify-between font-semibold">
                                <span>Subtotal</span>
                                <span>₹{invoice.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Taxes</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t text-primary">
                                <span>Total Amount</span>
                                <span>₹{invoice.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-12 pt-6 border-t text-center text-muted-foreground text-sm">
                        <p>Thank you for your business!</p>
                        <p>If you have any questions, please contact our support team.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default InvoicePageContent;

    