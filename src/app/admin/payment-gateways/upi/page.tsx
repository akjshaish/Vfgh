
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveUpiSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const upiSettingsSchema = z.object({
  enabled: z.boolean(),
  upiId: z.string().optional(),
  upiName: z.string().optional(),
});

type UpiSettingsFormData = z.infer<typeof upiSettingsSchema>;

export default function AdminUpiGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, control, watch, reset, handleSubmit, formState: { errors } } = useForm<UpiSettingsFormData>({
    resolver: zodResolver(upiSettingsSchema),
    defaultValues: {
        enabled: true,
        upiId: '',
        upiName: '',
    },
  });

  const watchUpiEnabled = watch('enabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/gateways/upi');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch UPI settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: UpiSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveUpiSettings(data);
      toast({
        title: "Success",
        description: "UPI settings have been saved successfully.",
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
            <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">UPI Payment Gateway</h1>
        <p className="text-sm text-muted-foreground">
          Configure UPI deep links for manual payment confirmation.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>UPI Configuration</CardTitle>
                <CardDescription>Enable the UPI payment method for your customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-2">
                    <Controller
                        name="enabled"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="enabled"
                                checked={field.value}
                                onCheckedChange={(value) => {
                                    startTransition(() => {
                                        field.onChange(value);
                                    });
                                }}
                            />
                        )}
                    />
                    <Label htmlFor="enabled">Enable UPI Gateway (Manual Confirmation)</Label>
                </div>
                 {watchUpiEnabled && (
                     <div className="space-y-4 pl-8 pt-4 border-l">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">Your UPI ID</Label>
                            <Input id="upiId" {...register('upiId')} placeholder="your-id@bank" />
                            {errors?.upiId && <p className="text-sm text-destructive">{errors.upiId.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="upiName">Your Name (Payee Name)</Label>
                            <Input id="upiName" {...register('upiName')} placeholder="e.g., John Doe" />
                             {errors?.upiName && <p className="text-sm text-destructive">{errors.upiName.message}</p>}
                        </div>
                    </div>
                )}
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>About UPI Gateway</AlertTitle>
                    <AlertDescription>
                        This gateway allows users to pay via a UPI deep link. Since payment confirmation is not automatic, orders will be marked as 'Pending' and you must manually activate them after confirming payment.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save UPI Settings'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
