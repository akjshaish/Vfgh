
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Loader2, Mail } from 'lucide-react';
import { handlePasswordResetRequest, type PasswordResetFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { AdvertisementBanner } from '../dashboard/advertisement-banner';

const initialState: PasswordResetFormState = {
    message: '',
    isError: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {pending ? 'Sending...' : 'Send Reset Code'}
        </Button>
    );
}


export default function ForgotPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = useActionState(handlePasswordResetRequest, initialState);

    useEffect(() => {
        if (state.message) {
            toast({
                variant: state.isError ? 'destructive' : 'default',
                title: state.isError ? 'Error' : 'Success',
                description: state.message,
            });
        }
        if (state.success && state.email) {
            router.push(`/reset-password?email=${encodeURIComponent(state.email)}`);
        }
    }, [state, router, toast]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <AdvertisementBanner location="forgot_password" />
                <Card>
                    <CardHeader className="text-center">
                        <div className="mb-4 flex justify-center">
                            <Logo />
                        </div>
                        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                        <CardDescription>Enter your email and we'll send you a code to reset your password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
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
        </div>
    );
}
