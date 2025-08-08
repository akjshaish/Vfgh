
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveDnsSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DnsTestForm } from './dns-test-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dnsSettingsSchema = z.object({
  autoDnsEnabled: z.boolean(),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  username: z.string().optional(),
  apiToken: z.string().optional(),
  testModeEnabled: z.boolean(),
});

type DnsSettingsFormData = z.infer<typeof dnsSettingsSchema>;

export default function AdminDnsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [domainForTest, setDomainForTest] = useState<string | undefined>(undefined);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<DnsSettingsFormData>({
    resolver: zodResolver(dnsSettingsSchema),
    defaultValues: {
      autoDnsEnabled: false,
      host: '',
      port: 2083,
      username: '',
      apiToken: '',
      testModeEnabled: true,
    },
  });

  const watchAutoDnsEnabled = watch('autoDnsEnabled');
  const watchTestModeEnabled = watch('testModeEnabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const dnsSettingsRef = ref(db, 'settings/dns');
        const dnsSnapshot = await get(dnsSettingsRef);
        if (dnsSnapshot.exists()) {
          reset(dnsSnapshot.val());
        }

        const domainSettingsRef = ref(db, 'settings/domain');
        const domainSnapshot = await get(domainSettingsRef);
        if (domainSnapshot.exists()) {
            setDomainForTest(domainSnapshot.val().domain);
        }

      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch cPanel settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: DnsSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveDnsSettings(data);
      toast({
        title: "Success",
        description: "cPanel API settings have been saved successfully.",
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
        <h1 className="text-3xl font-bold font-headline">cPanel API Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Manage automatic subdomain creation via the cPanel API.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Automatic Subdomain Provisioning</CardTitle>
                <CardDescription>Enable this to automatically create subdomains using your cPanel API token.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center space-x-2">
                    <Controller
                        name="autoDnsEnabled"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="autoDnsEnabled"
                                checked={field.value}
                                onCheckedChange={(value) => {
                                    startTransition(() => {
                                        field.onChange(value);
                                    });
                                }}
                            />
                        )}
                    />
                    <Label htmlFor="autoDnsEnabled">Enable Automatic Subdomain Creation</Label>
                </div>
                {watchAutoDnsEnabled && (
                    <div className="grid gap-4 pl-8 pt-4 border-l">
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">cPanel Host</Label>
                                <Input id="host" {...register('host')} placeholder="your-domain.com" />
                                {errors.host && <p className="text-destructive text-sm mt-1">{errors.host.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">cPanel API Port</Label>
                                <Input id="port" type="number" {...register('port')} placeholder="2083" />
                                {errors.port && <p className="text-destructive text-sm mt-1">{errors.port.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="username">cPanel Username</Label>
                            <Input id="username" {...register('username')} placeholder="your_cpanel_username" />
                            {errors.username && <p className="text-destructive text-sm mt-1">{errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiToken">cPanel API Token</Label>
                            <Input id="apiToken" type="password" {...register('apiToken')} placeholder="Enter your cPanel API token" />
                             {errors.apiToken && <p className="text-destructive text-sm mt-1">{errors.apiToken.message}</p>}
                        </div>
                    </div>
                )}
                 <div className="flex items-center space-x-2 pt-4">
                    <Controller
                        name="testModeEnabled"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="testModeEnabled"
                                checked={field.value}
                                onCheckedChange={(value) => {
                                    startTransition(() => {
                                        field.onChange(value);
                                    });
                                }}
                            />
                        )}
                    />
                    <Label htmlFor="testModeEnabled">Enable Test Mode</Label>
                </div>
                {watchTestModeEnabled && (
                    <Alert className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Test Mode is On</AlertTitle>
                        <AlertDescription>
                            While test mode is enabled, subdomain creation will be simulated. The AI will process requests, but no real subdomains will be created on your cPanel.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save API Settings'}
                </Button>
            </CardFooter>
        </Card>
      </form>

       <Card>
            <CardHeader>
                <CardTitle>Test Subdomain Creation</CardTitle>
                <CardDescription>Test the AI flow for subdomain creation without creating a real record. This uses the same validation logic as the user-facing form.</CardDescription>
            </CardHeader>
            <CardContent>
                <DnsTestForm domain={domainForTest} />
            </CardContent>
        </Card>
    </div>
  );
}
