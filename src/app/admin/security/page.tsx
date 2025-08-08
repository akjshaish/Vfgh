
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveSecuritySettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const securitySettingsSchema = z.object({
  antiVpnEnabled: z.boolean(),
  ipinfoApiToken: z.string().optional(),
  appCheckEnabled: z.boolean(),
  reCaptchaSiteKey: z.string().optional(),
  ddosProtectionLevel: z.enum(['normal', 'advanced', 'maximum']).default('normal'),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { handleSubmit, reset, control, watch, formState: { isSubmitting, isDirty } } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      antiVpnEnabled: false,
      ipinfoApiToken: '',
      appCheckEnabled: false,
      reCaptchaSiteKey: '',
      ddosProtectionLevel: 'normal',
    },
  });

  const watchAntiVpnEnabled = watch('antiVpnEnabled');
  const watchAppCheckEnabled = watch('appCheckEnabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/security');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const settings = snapshot.val();
          reset({
            antiVpnEnabled: settings.antiVpnEnabled || false,
            ipinfoApiToken: settings.ipinfoApiToken || '',
            appCheckEnabled: settings.appCheckEnabled || false,
            reCaptchaSiteKey: settings.reCaptchaSiteKey || '',
            ddosProtectionLevel: settings.ddosProtectionLevel || 'normal',
          });
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch security settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: SecuritySettingsFormData) => {
    try {
      await saveSecuritySettings(data);
      toast({
        title: "Success",
        description: "Security settings have been saved successfully.",
      });
      reset(data); // Resets the form's dirty state after successful submission
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
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
        <h1 className="text-3xl font-bold font-headline">Security & Protection</h1>
        <p className="text-sm text-muted-foreground">
          Enhance your platform's security against common threats.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Protection Services</CardTitle>
                <CardDescription>Enable or disable various security features to protect your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Controller
                          name="antiVpnEnabled"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id="antiVpnEnabled"
                              checked={field.value}
                              onCheckedChange={(value) => {
                                startTransition(() => {
                                    field.onChange(value);
                                });
                              }}
                            />
                          )}
                        />
                        <Label htmlFor="antiVpnEnabled">Enable Anti-VPN Protection</Label>
                    </div>
                     {watchAntiVpnEnabled && (
                        <div className="space-y-2 pl-8 pt-4 border-l">
                            <Label htmlFor="ipinfoApiToken">IPinfo.io API Token</Label>
                             <Controller
                                name="ipinfoApiToken"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="ipinfoApiToken"
                                        type="password"
                                        placeholder="Enter your IPinfo API token"
                                        {...field}
                                    />
                                )}
                            />
                             <p className="text-xs text-muted-foreground">This token will be used to detect users signing up via VPNs.</p>
                        </div>
                    )}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How Anti-VPN Works</AlertTitle>
                        <AlertDescription>
                          When enabled, this feature will check the user's IP address against ipinfo.io during registration to block known VPN providers. You must provide a valid API token from ipinfo.io for this to work.
                        </AlertDescription>
                    </Alert>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Controller
                          name="appCheckEnabled"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id="appCheckEnabled"
                              checked={field.value}
                              onCheckedChange={(value) => {
                                startTransition(() => {
                                    field.onChange(value);
                                });
                              }}
                            />
                          )}
                        />
                        <Label htmlFor="appCheckEnabled">Enable Firebase App Check (Anti-Canary)</Label>
                    </div>
                     {watchAppCheckEnabled && (
                        <div className="space-y-2 pl-8 pt-4 border-l">
                            <Label htmlFor="reCaptchaSiteKey">Google reCAPTCHA v3 Site Key</Label>
                             <Controller
                                name="reCaptchaSiteKey"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="reCaptchaSiteKey"
                                        type="text"
                                        placeholder="Enter your reCAPTCHA site key"
                                        {...field}
                                    />
                                )}
                            />
                             <p className="text-xs text-muted-foreground">This key is required for App Check to function.</p>
                        </div>
                    )}
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>What is App Check?</AlertTitle>
                        <AlertDescription>
                         App Check protects your backend resources from abuse by ensuring that incoming requests originate from your actual app, and not from an unauthorized client. This is the recommended way to prevent your Firebase keys from being abused.
                          <br /><strong className="font-semibold">Note:</strong> To enable this, you must set up App Check in the Firebase Console, create a reCAPTCHA v3 key, and enter the site key above.
                        </AlertDescription>
                    </Alert>
                 </div>

                 <Separator />

                 <div className="space-y-4">
                    <Label className="text-base font-semibold">DDoS Protection Level</Label>
                     <Controller
                        control={control}
                        name="ddosProtectionLevel"
                        render={({ field }) => (
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid gap-4 md:grid-cols-3"
                            >
                                <Label htmlFor="ddos-normal" className="p-4 border rounded-md cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                                    <RadioGroupItem value="normal" id="ddos-normal" className="sr-only" />
                                    <span className="font-bold block mb-1">Normal</span>
                                    <span className="text-sm text-muted-foreground">Standard protection. No interruptions for users.</span>
                                </Label>
                                 <Label htmlFor="ddos-advanced" className="p-4 border rounded-md cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                                    <RadioGroupItem value="advanced" id="ddos-advanced" className="sr-only" />
                                    <span className="font-bold block mb-1">Under Attack</span>
                                    <span className="text-sm text-muted-foreground">Activates an automatic verification page on your homepage to challenge suspicious traffic.</span>
                                 </Label>
                                 <Label htmlFor="ddos-maximum" className="p-4 border rounded-md cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/5">
                                    <RadioGroupItem value="maximum" id="ddos-maximum" className="sr-only" />
                                    <span className="font-bold block mb-1">Maximum Security</span>
                                    <span className="text-sm text-muted-foreground">Requires users to manually complete a checkbox challenge on the homepage to proceed.</span>
                                </Label>
                            </RadioGroup>
                        )}
                    />
                 </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={!isDirty || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save Security Settings'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
