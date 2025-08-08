
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveMaintenanceSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info, ServerCrash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['full', 'partial']),
  fullMessage: z.string().optional(),
  partialMessage: z.string().optional(),
  serverOverloadEnabled: z.boolean(),
  serverOverloadMessage: z.string().optional(),
});

type MaintenanceSettingsFormData = z.infer<typeof maintenanceSettingsSchema>;

export default function AdminMaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<MaintenanceSettingsFormData>({
    resolver: zodResolver(maintenanceSettingsSchema),
    defaultValues: {
      enabled: false,
      type: 'full',
      fullMessage: 'The platform is currently down for scheduled maintenance. We apologize for any inconvenience and will be back online shortly. Thank you for your patience.',
      partialMessage: 'Service management is temporarily unavailable due to maintenance. You can still order new services. We appreciate your understanding.',
      serverOverloadEnabled: false,
      serverOverloadMessage: 'We are currently experiencing high traffic and have temporarily disabled new registrations. Please try again later. We appreciate your patience!',
    },
  });

  const watchEnabled = watch('enabled');
  const watchType = watch('type');
  const watchServerOverloadEnabled = watch('serverOverloadEnabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/maintenance');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch maintenance settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: MaintenanceSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveMaintenanceSettings(data);
      toast({
        title: "Success",
        description: "Maintenance settings have been saved.",
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
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">System Status</h1>
        <p className="text-sm text-muted-foreground">
          Control site access during maintenance or high traffic periods.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Maintenance & Status Modes</CardTitle>
                <CardDescription>Activate different modes to manage site availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <Label htmlFor="enabled">Enable Dashboard Maintenance Mode</Label>
                </div>

                {watchEnabled && (
                    <div className="grid gap-6 pl-8 pt-4 border-l">
                         <div>
                            <Label className="font-semibold">Maintenance Type</Label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="full" id="full" />
                                            <Label htmlFor="full">Full Maintenance</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-6">Locks the entire client dashboard. Users can only log in.</p>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="partial" id="partial" />
                                            <Label htmlFor="partial">Partial Maintenance</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-6">Allows users to order new services but blocks access to service management.</p>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullMessage">Full Maintenance Message</Label>
                            <Textarea id="fullMessage" {...register('fullMessage')} rows={4} />
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="partialMessage">Partial Maintenance Message</Label>
                            <Textarea id="partialMessage" {...register('partialMessage')} rows={4} />
                        </div>
                    </div>
                )}
                
                <Separator />

                <div className="space-y-4">
                     <div className="flex items-center space-x-2">
                        <Controller
                            name="serverOverloadEnabled"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="serverOverloadEnabled"
                                    checked={field.value}
                                    onCheckedChange={(value) => {
                                        startTransition(() => {
                                            field.onChange(value);
                                        });
                                    }}
                                />
                            )}
                        />
                        <Label htmlFor="serverOverloadEnabled">Enable Server Overload Mode</Label>
                    </div>

                    <Alert className="mt-2">
                        <ServerCrash className="h-4 w-4" />
                        <AlertTitle>About Server Overload Mode</AlertTitle>
                        <AlertDescription>
                            When enabled, this mode will disable new user registrations to prevent server strain. Existing users will still be able to log in and use the service.
                        </AlertDescription>
                    </Alert>

                     {watchServerOverloadEnabled && (
                         <div className="space-y-2 pl-8 pt-4 border-l">
                            <Label htmlFor="serverOverloadMessage">Server Overload Message</Label>
                            <Textarea id="serverOverloadMessage" {...register('serverOverloadMessage')} rows={4} />
                        </div>
                    )}
                </div>


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
