
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Plan } from '@/app/admin/plans/page';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/loader';
import { AdvertisementBanner } from '../advertisement-banner';

export default function OrderPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = ref(db, 'plans');
        const snapshot = await get(plansRef);
        if (snapshot.exists()) {
          const plansData = snapshot.val();
          const plansArray = Object.keys(plansData).map(key => ({
            id: key,
            ...plansData[key]
          }));
          setPlans(plansArray);
        } else {
          setPlans([]);
        }
      } catch (err) {
        setError('Failed to fetch plans. Please check your database connection and rules.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleOrderClick = (planId?: string) => {
    if (!planId) return;
    setIsNavigating(true);
    router.push(`/dashboard/order/${planId}`);
  };


  return (
    <>
    {isNavigating && <Loader />}
    <div className="space-y-8">
      <AdvertisementBanner location="order" />
      <div>
        <h1 className="text-3xl font-bold font-headline">Order New Services</h1>
        <p className="text-sm text-muted-foreground">
          Choose from our available hosting plans.
        </p>
      </div>

      {error && <p className="text-destructive">{error}</p>}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
               <CardFooter>
                 <Skeleton className="h-10 w-full" />
               </CardFooter>
            </Card>
          ))
        ) : plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {plan.price > 0 ? `₹${plan.price}/mo` : 'Free'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {Array.isArray(plan.features) && plan.features.map(feature => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" onClick={() => handleOrderClick(plan.id)} disabled={isNavigating}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Order Now
                 </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p>No plans available to order.</p>
        )}
      </div>
    </div>
    </>
  );
}
