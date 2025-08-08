
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { AuthLoader } from '@/components/auth-loader';
import { logAuthEvent, handleLoginVerification } from '@/lib/actions';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader } from '@/components/loader';


export default function LoginPage() {
  const [step, setStep] = useState('credentials'); // 'credentials', 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { userId: loggedInUserId, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && loggedInUserId) {
      router.push('/dashboard');
    }
  }, [loggedInUserId, authLoading, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (email === 'admin@razorhost.xyz' && password === 'password123') {
        // In a real app, admin login would also have 2FA and better security
        localStorage.setItem('userId', 'admin'); 
        localStorage.setItem('userEmail', 'admin@razorhost.xyz'); 
        await logAuthEvent({ email, action: 'Login' });
        router.push('/admin');
        return;
      }
      
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const userSnapshot = await get(userQuery);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const foundUserId = Object.keys(userData)[0];
        const user = userData[foundUserId];
        
        if (user.status === 'Pending') {
            setError('Your account is pending verification. Please check your email for a verification code.');
            setLoading(false);
            return;
        }

        if (user.password === password) {
            setUserId(foundUserId);
            const verificationResult = await handleLoginVerification(email, 'login');
             if (verificationResult.success) {
                setStep('verify');
                toast({
                    title: "Check your email",
                    description: "We've sent a 6-digit verification code to your email address.",
                })
            } else {
                setError(verificationResult.message);
            }
        } else {
          setError('Invalid email or password.');
        }
      } else {
        setError('Invalid email or password.');
      }

    } catch (dbError: any) {
       console.error("Database Error:", dbError);
       setError('Failed to connect to the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      if (!userId) {
          setError('User ID not found. Please try logging in again.');
          setLoading(false);
          return;
      }

      try {
          const userRef = ref(db, `users/${userId}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
              const user = snapshot.val();
              if (user.loginVerificationCode === verificationCode && user.loginVerificationExpires > Date.now()) {
                  // Clear verification code
                  await update(userRef, {
                      loginVerificationCode: null,
                      loginVerificationExpires: null,
                  });
                  
                  // Store session
                  localStorage.setItem('userId', userId);
                  localStorage.setItem('userEmail', user.email);
                  
                  await logAuthEvent({ email, action: 'Login' });
                  router.push('/dashboard');
              } else {
                  setError('Invalid or expired verification code.');
              }
          } else {
              setError('User not found.');
          }
      } catch (error) {
          setError('An error occurred during verification.');
      } finally {
          setLoading(false);
      }
  }
  
  if (authLoading || loggedInUserId) {
    return <Loader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Logo />
            </div>
            {step === 'credentials' && (
                <>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </>
            )}
             {step === 'verify' && (
                <>
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription>We've sent a 6-digit verification code.</CardDescription>
                </>
            )}
        </CardHeader>
        <CardContent>
          {step === 'credentials' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" passHref>
                        <span className="text-sm text-primary hover:underline cursor-pointer">
                            Forgot password?
                        </span>
                    </Link>
                </div>
                 <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
               {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
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
                {error && <p className="text-sm text-center text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                </Button>
            </form>
          )}


          {loading && <AuthLoader />}
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
