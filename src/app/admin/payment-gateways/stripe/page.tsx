
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveStripeSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const stripeSettingsSchema = z.object({
  enabled: z.boolean(),
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
});

type StripeSettingsFormData = z.infer<typeof stripeSettingsSchema>;

export default function AdminStripeGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const { register, control, watch, reset, handleSubmit } = useForm<StripeSettingsFormData>({
    resolver: zodResolver(stripeSettingsSchema),
    defaultValues: {
        enabled: false,
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
    },
  });

  const watchStripeEnabled = watch('enabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/gateways/stripe');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const settings = snapshot.val();
          reset({
            enabled: settings.enabled || false,
            publishableKey: settings.publishableKey || '',
            secretKey: '',
            webhookSecret: '',
          });
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch Stripe settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);
  

  const onSubmit = async (data: StripeSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveStripeSettings(data);
      toast({
        title: "Success",
        description: "Stripe settings have been saved.",
      });
      // Clear password fields on successful save
      reset({
        ...data,
        secretKey: '',
        webhookSecret: '',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save Stripe settings. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            <Card><CardContent className="p-6"><Skeleton className="h-[500px] w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Stripe Payment Gateway</h1>
        <p className="text-sm text-muted-foreground">
          Configure Stripe for automated card and UPI payments.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Stripe Configuration</CardTitle>
                <CardDescription>Enable Stripe to accept payments automatically.</CardDescription>
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
                    <Label htmlFor="enabled">Enable Stripe</Label>
                </div>
                 {watchStripeEnabled && (
                     <div className="space-y-4 pl-8 pt-4 border-l">
                        <div className="space-y-2">
                            <Label htmlFor="publishableKey">Publishable Key</Label>
                            <Input id="publishableKey" {...register('publishableKey')} placeholder="pk_test_..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secretKey">Secret Key</Label>
                            <div className="relative">
                                <Input id="secretKey" type={showStripeSecret ? 'text' : 'password'} {...register('secretKey')} placeholder="sk_test_... (leave blank to keep current)" />
                                 <button type="button" onClick={() => setShowStripeSecret(!showStripeSecret)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showStripeSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="webhookSecret">Webhook Signing Secret</Label>
                            <div className="relative">
                                 <Input id="webhookSecret" type={showWebhookSecret ? 'text' : 'password'} {...register('webhookSecret')} placeholder="whsec_... (leave blank to keep current)" />
                                  <button type="button" onClick={() => setShowWebhookSecret(!showWebhookSecret)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showWebhookSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Webhook URL</AlertTitle>
                                <AlertDescription>
                                    Set your webhook URL in the Stripe dashboard to: <br />
                                    <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">https://your-domain.com/api/stripe/webhook</code>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save Stripe Settings'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
