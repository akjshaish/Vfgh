'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveRestrictionSettings } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const restrictionSettingsSchema = z.object({
  freeUserLimitEnabled: z.boolean(),
});

type RestrictionSettingsFormData = z.infer<typeof restrictionSettingsSchema>;

export default function AdminRestrictionsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch } = useForm<RestrictionSettingsFormData>({
    resolver: zodResolver(restrictionSettingsSchema),
    defaultValues: {
      freeUserLimitEnabled: true,
    },
  });

  const watchFreeUserLimitEnabled = watch('freeUserLimitEnabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/restrictions');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch restriction settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: RestrictionSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveRestrictionSettings(data);
      toast({
        title: "Success",
        description: "Restriction settings have been saved.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Usage Restrictions</h1>
        <p className="text-sm text-muted-foreground">
          Control limits and restrictions for different user types.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Free User Restrictions</CardTitle>
            <CardDescription>Manage limits for users on the free plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4 p-4 border rounded-lg">
              <Controller
                name="freeUserLimitEnabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="freeUserLimitEnabled"
                    checked={field.value}
                    onCheckedChange={(value) => {
                      startTransition(() => {
                        field.onChange(value);
                      });
                    }}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex-1">
                <Label htmlFor="freeUserLimitEnabled" className="text-base font-semibold">
                  Limit Free Users to One Service
                </Label>
                <AlertDescription className="mt-1">
                  When enabled, users can only order a single free service. If they try to order another, they will be blocked. When disabled, users can order unlimited free services.
                </AlertDescription>
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>How it Works</AlertTitle>
              <AlertDescription>
                This setting specifically targets plans with a price of ₹0. If a user already has an active or pending service from a free plan, they will be unable to complete the checkout for another free plan while this restriction is enabled.
              </AlertDescription>
            </Alert>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
