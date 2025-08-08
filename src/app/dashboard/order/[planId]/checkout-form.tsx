
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plan } from '@/app/admin/plans/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Loader2, CheckCircle, Wallet, ClipboardCopy, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { orderService, createStripeCheckoutSession } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { loadStripe } from '@stripe/stripe-js';

interface CheckoutFormProps {
    plan: Plan;
}

interface GatewaySettings {
    upi?: { enabled: boolean; upiId?: string; upiName?: string };
    stripe?: { enabled: boolean; publishableKey?: string };
}

export function CheckoutForm({ plan }: CheckoutFormProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { userId, userEmail } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [order, setOrder] = useState<{serviceId: string, [key: string]: any} | null>(null);
    const [gateways, setGateways] = useState<GatewaySettings | null>(null);
    const [loadingGateways, setLoadingGateways] = useState(true);

    useEffect(() => {
        const fetchGatewaySettings = async () => {
            try {
                const settingsRef = ref(db, 'settings/gateways');
                const snapshot = await get(settingsRef);
                if (snapshot.exists()) {
                    const settings = snapshot.val();
                    setGateways(settings);
                    // Set default payment method
                    if (settings.stripe?.enabled) {
                        setPaymentMethod('stripe');
                    } else if (settings.upi?.enabled) {
                        setPaymentMethod('upi');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch gateway settings", error);
                 toast({ variant: "destructive", title: "Error", description: "Could not load payment options." });
            } finally {
                setLoadingGateways(false);
            }
        };
        fetchGatewaySettings();
    }, [toast]);

    const handleCreateOrder = async () => {
        if (order) return order; 
        setIsSubmitting(true);
        try {
           const newOrder = await orderService({ plan, userId: userId!, paymentMethod });
           setOrder(newOrder);
           toast({ title: "Order Created!", description: `Your Order ID is ${newOrder.serviceId}. Please complete the payment.` });
           return newOrder;
        } catch (err) {
            toast({ variant: "destructive", title: "Order Failed", description: "There was an error placing your order." });
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }


    const handleStripePayment = async () => {
        setIsSubmitting(true);
        // Create the order first to get a serviceId
        const createdOrder = await handleCreateOrder();
        if (!createdOrder) {
            setIsSubmitting(false);
            return;
        }

        try {
            const { sessionId, error } = await createStripeCheckoutSession({ planId: plan.id!, userId: userId!, serviceId: createdOrder.serviceId });
            if (error || !sessionId) {
                throw new Error(error || 'Failed to create Stripe session.');
            }
            const stripe = await loadStripe(gateways?.stripe?.publishableKey || '');
            if (stripe) {
                await stripe.redirectToCheckout({ sessionId });
            } else {
                throw new Error("Stripe.js has not loaded yet.");
            }
        } catch (err) {
             toast({ variant: "destructive", title: "Stripe Error", description: err instanceof Error ? err.message : "Could not redirect to Stripe." });
             setIsSubmitting(false);
        }
    }
    
    const handleUpiPayment = async () => {
        await handleCreateOrder();
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: 'Order ID copied to clipboard.' });
    };

    const upiLink = gateways?.upi?.enabled && gateways.upi.upiId && order
    ? `upi://pay?pa=${gateways.upi.upiId}&pn=${encodeURIComponent(gateways.upi.upiName || 'AquaHost')}&am=${plan.price.toFixed(2)}&cu=INR&tn=Order%20%23${order.serviceId}%20for%20${encodeURIComponent(plan.name)}`
    : '#';
    
    const noGatewaysEnabled = !loadingGateways && !gateways?.stripe?.enabled && !gateways?.upi?.enabled;

    return (
        <Card>
            {step === 1 && (
                <>
                    <CardHeader>
                        <CardTitle>Step 1: Contact Information</CardTitle>
                        <CardDescription>Confirm your details for the invoice.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" defaultValue={userEmail || ''} disabled />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Main St" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="pincode">PIN Code</Label>
                                <Input id="pincode" placeholder="12345" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={() => setStep(2)}>Next: Review Invoice</Button>
                    </CardFooter>
                </>
            )}

            {step === 2 && (
                <>
                    <CardHeader>
                        <CardTitle>Step 2: Review Invoice</CardTitle>
                        <CardDescription>Please review your order details before proceeding to payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <AlertTitle>Invoice Summary</AlertTitle>
                            <AlertDescription>
                                <div className="flex justify-between py-2 border-b">
                                    <span>Plan: {plan.name}</span>
                                    <span>₹{plan.price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 font-bold">
                                    <span>Total Due Today</span>
                                    <span>₹{plan.price.toFixed(2)}</span>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button onClick={() => setStep(3)}>Next: Payment</Button>
                    </CardFooter>
                </>
            )}

            {step === 3 && (
                 <>
                    <CardHeader>
                        <CardTitle>Step 3: Complete Payment</CardTitle>
                        <CardDescription>Choose your preferred payment method.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loadingGateways ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : noGatewaysEnabled ? (
                             <Alert variant="destructive">
                                <AlertCircleIcon className="h-4 w-4" />
                                <AlertTitle>Payments Unavailable</AlertTitle>
                                <AlertDescription>
                                    Online payments are currently not configured. Please contact support to complete your order.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                {gateways?.stripe?.enabled && (
                                    <Label
                                        htmlFor="stripe"
                                        className="flex items-center space-x-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <RadioGroupItem value="stripe" id="stripe" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Pay with Stripe</span>
                                            <span className="text-sm text-muted-foreground">Accepts Cards, UPI, Netbanking. (Automatic)</span>
                                        </div>
                                    </Label>
                                )}
                                {gateways?.upi?.enabled && (
                                     <Label
                                        htmlFor="upi"
                                        className="flex items-center space-x-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <RadioGroupItem value="upi" id="upi" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Pay with UPI</span>
                                            <span className="text-sm text-muted-foreground">Use any UPI app. (Manual Confirmation)</span>
                                        </div>
                                    </Label>
                                )}
                            </RadioGroup>
                        )}
                        
                        {paymentMethod === 'upi' && gateways?.upi?.enabled && (
                            order ? (
                                <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-background space-y-4 text-center">
                                    <CheckCircle className="h-12 w-12 text-green-500" />
                                    <h3 className="font-bold">Your Order is Pending!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your order ID is 
                                        <span className="font-mono text-primary mx-1">{order.serviceId}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => copyToClipboard(order.serviceId)}>
                                            <ClipboardCopy className="h-4 w-4" />
                                        </Button>
                                        . Click the button below to complete the payment.
                                    </p>
                                    <Button asChild size="lg">
                                        <Link href={upiLink}>
                                            <Wallet className="mr-2 h-5 w-5" /> Pay ₹{plan.price.toFixed(2)} via UPI
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/services')}>I have paid, go to My Services</Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-background space-y-4">
                                   <p className="text-center text-sm">You'll generate an Order ID and then be shown a payment link. The service will be activated manually after payment confirmation.</p>
                                </div>
                            )
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        {!noGatewaysEnabled && (
                            <>
                                {paymentMethod === 'stripe' && (
                                    <Button onClick={handleStripePayment} disabled={isSubmitting || loadingGateways || !paymentMethod}>
                                        {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> ) : ( <>Pay with Stripe</> )}
                                    </Button>
                                )}
                                {paymentMethod === 'upi' && (
                                    <Button onClick={handleUpiPayment} disabled={isSubmitting || loadingGateways || !paymentMethod || !!order}>
                                        {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Order...</> ) : ( <>Confirm & Generate UPI Link</> )}
                                    </Button>
                                )}
                            </>
                        )}
                    </CardFooter>
                 </>
            )}
        </Card>
    )
}
