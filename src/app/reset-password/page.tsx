
'use client';

import { useActionState, useEffect, Suspense, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Loader2, KeyRound } from 'lucide-react';
import { handlePasswordReset, type PasswordResetFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"


const initialState: PasswordResetFormState = {
    message: '',
    isError: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            {pending ? 'Resetting Password...' : 'Reset Password'}
        </Button>
    );
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const emailFromQuery = searchParams.get('email');
    
    const [state, formAction] = useActionState(handlePasswordReset, initialState);
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (!emailFromQuery) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Email is missing. Please start the process again.',
            });
            router.push('/forgot-password');
        }
    }, [emailFromQuery, router, toast]);

    useEffect(() => {
        if (state.message) {
            toast({
                variant: state.isError ? 'destructive' : 'default',
                title: state.isError ? 'Error' : 'Success',
                description: state.message,
            });
            if (state.success) {
                router.push('/login');
            }
        }
    }, [state, router, toast]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl font-bold">Set a New Password</CardTitle>
                    <CardDescription>Enter the OTP from your email and choose a new password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                         <input type="hidden" name="email" value={emailFromQuery || ''} />
                         <div className="space-y-2">
                            <Label htmlFor="otp">Verification Code (OTP)</Label>
                            <InputOTP name="otp" maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                                <InputOTPGroup className="w-full">
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                            />
                        </div>
                        {state.message && state.isError && (
                            <p className="text-sm text-destructive">{state.message}</p>
                        )}
                        <SubmitButton />
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Remembered your password?{' '}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
