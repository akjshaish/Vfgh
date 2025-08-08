
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check, HardDrive } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export interface ServicePlan {
    id?: string;
    name: string;
    price: number;
    features: string[];
    websites: number; // -1 for unlimited
    storage: number; // in MB
}

export default function AdminServicesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
        setLoading(true);
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
          setError('Failed to fetch service plans. Please check your database connection and rules.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
    fetchPlans();
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold font-headline">Service Plans</h1>
                <p className="text-sm text-muted-foreground">
                    Create, edit, and manage your hosting service plans.
                </p>
            </div>
             <Button onClick={() => router.push('/admin/services/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Service
            </Button>
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
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
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
                                <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                    {plan.websites === -1 ? 'Unlimited Websites' : `${plan.websites} Website(s)`}
                                </li>
                                <li className="flex items-center">
                                    <HardDrive className="h-4 w-4 mr-2 text-gray-500" />
                                    {plan.storage / 1024 >= 1 ? `${plan.storage / 1024} GB Storage` : `${plan.storage} MB Storage`}
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full" onClick={() => router.push(`/admin/services/edit/${plan.id}`)}>Edit Service</Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <p>No service plans found. Create one to get started.</p>
            )}
        </div>
    </div>
  )
}
