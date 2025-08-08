
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSmtpSettings, type SmtpFormState } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Info, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP Host is required'),
  smtpPort: z.coerce.number().int().min(1, "Port must be a positive number"),
  smtpUser: z.string().email('A valid email address is required for the username'),
  smtpPass: z.string().optional(),
  requireVerification: z.boolean(),
});

type SmtpSettingsFormData = z.infer<typeof smtpSettingsSchema>;

const initialState: SmtpFormState = {
  message: '',
  isError: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? 'Saving...' : 'Save SMTP Settings'}
    </Button>
  );
}

export default function AdminSmtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [state, formAction] = useActionState(saveSmtpSettings, initialState);
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, control, reset, formState: { errors }, watch } = useForm<SmtpSettingsFormData>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      requireVerification: true,
    }
  });

  // Effect to show toast on success/error
  useEffect(() => {
    if (state.message) {
      toast({
        title: state.isError ? "Error" : "Success",
        description: state.message,
        variant: state.isError ? "destructive" : "default",
      });
    }
  }, [state, toast]);

  // Effect to fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/smtp');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const { smtpPass, ...rest } = snapshot.val();
          reset({
              ...rest,
              smtpPass: '',
          });
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch SMTP settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);
  

  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            <Card><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Email (SMTP) Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your SMTP server to send transactional emails.
        </p>
      </div>

      <form action={formAction}>
        <Card>
            <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>These settings are used for sending all system emails, like password resets and login verifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <Alert>
                    <KeyRound className="h-4 w-4" />
                    <AlertTitle>Using Google SMTP</AlertTitle>
                    <AlertDescription>
                        To use your Google account, you may need to generate an "App Password" from your Google Account security settings, as your regular password might not work.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input id="smtpHost" name="smtpHost" placeholder="e.g., smtp.gmail.com" {...register('smtpHost')} />
                        {state.errors?.smtpHost && <p className="text-destructive text-sm mt-1">{state.errors.smtpHost}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input id="smtpPort" name="smtpPort" type="number" placeholder="e.g., 587 or 465" {...register('smtpPort')} />
                        {state.errors?.smtpPort && <p className="text-destructive text-sm mt-1">{state.errors.smtpPort}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username (Your Email)</Label>
                    <Input id="smtpUser" name="smtpUser" placeholder="your-email@gmail.com" {...register('smtpUser')} />
                     {state.errors?.smtpUser && <p className="text-destructive text-sm mt-1">{state.errors.smtpUser}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password (or App Password)</Label>
                    <div className="relative">
                        <Input 
                            id="smtpPass" 
                            name="smtpPass" 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="your-password-or-app-password"
                             {...register('smtpPass')}
                        />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                     {state.errors?.smtpPass && <p className="text-destructive text-sm mt-1">{state.errors.smtpPass}</p>}
                     <p className="text-xs text-muted-foreground">Leave blank to keep the existing password.</p>
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Controller
                          name="requireVerification"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id="requireVerification"
                              checked={field.value}
                              onCheckedChange={(value) => {
                                startTransition(() => {
                                    field.onChange(value);
                                });
                              }}
                            />
                          )}
                        />
                        <input type="hidden" name="requireVerification" value={watch('requireVerification') ? 'on' : 'off'} />
                        <Label htmlFor="requireVerification">Require Email Verification for New Registrations</Label>
                    </div>
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Registration Flow</AlertTitle>
                        <AlertDescription>
                          If this is enabled, new users will be sent a verification code to their email to complete registration. If disabled, their account will be created instantly.
                        </AlertDescription>
                    </Alert>
                </div>

            </CardContent>
            <CardFooter>
                 <SubmitButton />
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
