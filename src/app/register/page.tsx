
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { AuthLoader } from '@/components/auth-loader';
import { Loader } from '@/components/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, Eye, EyeOff, Loader2 } from 'lucide-react';
import { handleRegistration, type RegistrationFormState } from '@/lib/actions';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface MaintenanceSettings {
  serverOverloadEnabled: boolean;
  serverOverloadMessage?: string;
}

const initialState: RegistrationFormState = {
  message: '',
  isError: false,
};


function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState(handleRegistration, initialState);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [step, setStep] = useState('register'); // 'register', 'verify'
  const [emailToVerify, setEmailToVerify] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { userId: loggedInUserId, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && loggedInUserId) {
      router.push('/dashboard');
    }
  }, [loggedInUserId, authLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/maintenance');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          setSettings(snapshot.val());
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (state.success && state.requiresVerification && state.email) {
      setStep('verify');
      setEmailToVerify(state.email);
    } else if (state.success) {
      toast({ title: "Success", description: state.message });
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  }, [state.success, state.requiresVerification, state.email, state.message, router, toast]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
        const usersRef = ref(db, 'users');
        const q = query(usersRef, orderByChild('email'), equalTo(emailToVerify));
        const snapshot = await get(q);
        
        if (!snapshot.exists()) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
            return;
        }

        const userId = Object.keys(snapshot.val())[0];
        const user = snapshot.val()[userId];

        if (user.loginVerificationCode === verificationCode && user.loginVerificationExpires > Date.now()) {
            await update(ref(db, `users/${userId}`), {
                status: 'Active',
                loginVerificationCode: null,
                loginVerificationExpires: null,
            });
            await logAuthEvent({ email: emailToVerify, action: 'Verification' });
            
            toast({ title: 'Success', description: 'Account verified! Please log in.' });
            router.push('/login');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid or expired verification code.' });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during verification.' });
    } finally {
        setIsVerifying(false);
    }
  };

  const logAuthEvent = async (payload: { email: string; action: 'Verification' | 'Register' | 'Login' }) => {
      // In a real app, this would be a server action call
      console.log('Logging auth event:', payload);
  };


  if (loadingSettings || authLoading || loggedInUserId) {
    return <Loader />;
  }

  if (settings?.serverOverloadEnabled) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                        <ServerCrash className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Registrations Temporarily Disabled</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground whitespace-pre-line">
                        {settings.serverOverloadMessage || 'We are currently experiencing high traffic and have temporarily disabled new registrations. Please try again later.'}
                    </p>
                    <div className="text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="underline font-medium text-primary">
                        Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                    <Logo />
                </div>
                {step === 'register' && (
                    <>
                        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                        <CardDescription>Enter your details to get started</CardDescription>
                    </>
                )}
                 {step === 'verify' && (
                    <>
                        <CardTitle className="text-2xl font-bold">Verify Your Account</CardTitle>
                        <CardDescription>We've sent a 6-digit code to {emailToVerify}.</CardDescription>
                    </>
                )}
            </CardHeader>
            <CardContent>
                {step === 'register' && (
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={pending} />
                        {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required disabled={pending} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required disabled={pending} />
                             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        </div>
                        {state.message && state.isError && <p className="text-sm text-destructive">{state.message}</p>}
                        {state.message && state.success && !state.requiresVerification && <p className="text-sm text-green-600">{state.message}</p>}

                        <SubmitButton pending={pending} />
                    </form>
                )}

                {step === 'verify' && (
                    <form onSubmit={handleVerificationSubmit} className="space-y-6">
                        <div className="flex justify-center">
                            <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <Button type="submit" className="w-full" disabled={isVerifying}>
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Account
                        </Button>
                    </form>
                )}

                {pending && <AuthLoader />}

                <div className="mt-4 text-center text-sm">
                    {step === 'register' ? "Already have an account?" : "Decided not to verify?"}{' '}
                    <Link href="/login" className="underline">
                    Sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
