
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { ServicePlanForm } from '../../service-plan-form';
import type { ServicePlan } from '../../page';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { serviceId } = params;

  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    const fetchPlan = async () => {
      try {
        const planRef = ref(db, `plans/${serviceId}`);
        const snapshot = await get(planRef);
        if (snapshot.exists()) {
          setPlan({ id: snapshot.key, ...snapshot.val() });
        } else {
          setError("Service plan not found.");
        }
      } catch (err) {
        setError("Failed to fetch plan details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [serviceId]);

  return (
    <div className="space-y-8">
      <div>
         <Button variant="ghost" onClick={() => router.push('/admin/services')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Services
        </Button>
        <h1 className="text-3xl font-bold font-headline">{`Edit Plan: ${plan?.name || ''}`}</h1>
        <p className="text-sm text-muted-foreground">
          Update the details for this service plan.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32 ml-auto" />
                </div>
            ) : error ? (
                 <p className="text-destructive">{error}</p>
            ) : (
                <ServicePlanForm plan={plan} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
