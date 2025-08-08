
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Plan } from '@/app/admin/plans/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckoutForm } from './checkout-form';


export default function CheckoutPage() {
    const params = useParams();
    const { planId } = params;
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!planId) return;

        const fetchPlan = async () => {
            try {
                const planRef = ref(db, `plans/${planId}`);
                const snapshot = await get(planRef);
                if (snapshot.exists()) {
                    setPlan({ id: snapshot.key, ...snapshot.val() });
                } else {
                    setError("Plan not found.");
                }
            } catch (err) {
                setError("Failed to fetch plan details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [planId]);


    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-96" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive">{error}</p>;
    }

    if (!plan) {
        return <p>This plan is not available for purchase.</p>
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Secure Checkout</h1>
                <p className="text-sm text-muted-foreground">
                    You are ordering the <span className="font-semibold text-primary">{plan.name}</span> plan.
                </p>
            </div>
            
            <CheckoutForm plan={plan} />
        </div>
    )
}
