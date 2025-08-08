
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { ref, get, set, push, query, orderByChild, equalTo, update } from 'firebase/database';
import type { Invoice } from '@/app/dashboard/billing/page';

async function getStripeSecrets() {
    try {
        const settingsRef = ref(db, 'settings/gateways/stripe');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            const { secretKey, webhookSecret } = snapshot.val();
            return { secretKey, webhookSecret };
        }
        return { secretKey: null, webhookSecret: null };
    } catch (error) {
        console.error("Failed to fetch Stripe secrets:", error);
        return { secretKey: null, webhookSecret: null };
    }
}

export async function POST(req: NextRequest) {
    const { secretKey, webhookSecret } = await getStripeSecrets();

    if (!secretKey || !webhookSecret) {
        console.error('Stripe secretKey or webhookSecret is not configured.');
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    let event: Stripe.Event;

    try {
        if (!sig) {
            throw new Error('No stripe-signature header found.');
        }
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
        return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const { userId, planId, serviceId } = session.metadata || {};

        if (!userId || !planId || !serviceId) {
            console.error('Webhook Error: Missing userId, planId, or serviceId in session metadata.');
            // Return a 200 to Stripe so it doesn't retry, but log the error.
            return NextResponse.json({ error: 'Missing metadata.' }, { status: 200 });
        }
        
        try {
            // Find the associated invoice and update its status to 'Paid'
            const invoicesQuery = query(ref(db, 'invoices'), orderByChild('serviceId'), equalTo(serviceId));
            const invoiceSnapshot = await get(invoicesQuery);

            if (invoiceSnapshot.exists()) {
                const invoiceData = invoiceSnapshot.val();
                const invoiceKey = Object.keys(invoiceData)[0];
                const invoiceRef = ref(db, `invoices/${invoiceKey}`);
                await update(invoiceRef, { status: 'Paid' });
            } else {
                 console.warn(`Webhook Warning: Could not find invoice for service ID ${serviceId} to mark as paid.`);
            }

            // Update the service status to 'Active'
            const serviceRef = ref(db, `users/${userId}/services/${serviceId}`);
            await update(serviceRef, { status: 'Active' });
            
            console.log(`✅ Successfully processed payment for service '${serviceId}' for user ${userId}.`);

        } catch (dbError) {
             console.error('Webhook Error: Database operation failed.', dbError);
             return NextResponse.json({ error: 'Database error.' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
