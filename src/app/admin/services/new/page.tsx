
'use client';

import { useRouter } from 'next/navigation';
import { ServicePlanForm } from '../service-plan-form';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewServicePage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
         <Button variant="ghost" onClick={() => router.push('/admin/services')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Services
        </Button>
        <h1 className="text-3xl font-bold font-headline">Create New Service Plan</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details for the new service plan.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
            <ServicePlanForm />
        </CardContent>
      </Card>
    </div>
  );
}
