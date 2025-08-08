
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLoader } from '@/components/auth-loader';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function DdosVerificationComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const level = searchParams.get('level') || 'advanced';

    const [isVerified, setIsVerified] = useState(false);
    const [isCheckComplete, setIsCheckComplete] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('Verifying your connection...');

    useEffect(() => {
        const verificationSteps = [
            { text: 'Verifying you are not a bot...', delay: 2000 },
            { text: 'Verifying your IP address...', delay: 3000 },
            { text: 'Please wait a moment...', delay: 3000 },
            { text: 'Successful', delay: 1500 },
        ];

        let cumulativeDelay = 0;

        if (level === 'advanced') {
            verificationSteps.forEach((step, index) => {
                cumulativeDelay += step.delay;
                setTimeout(() => {
                    setVerificationStatus(step.text);
                    if (index === verificationSteps.length - 1) { // On last step
                        setTimeout(() => {
                             setVerificationStatus('Continue...');
                             setIsCheckComplete(true);
                        }, 500)
                        setTimeout(() => {
                            setIsVerified(true);
                        }, 1000);
                    }
                }, cumulativeDelay);
            });
        }
    }, [level]);

    useEffect(() => {
        if (isVerified) {
            sessionStorage.setItem('ddos-verified', 'true');
            router.replace('/');
        }
    }, [isVerified, router]);

    const handleManualCheckChange = (checked: boolean | 'indeterminate') => {
        if (level === 'maximum' && checked === true) {
            setVerificationStatus('Verifying...');
             // Short delay to make it feel like something is happening
            setTimeout(() => {
                setVerificationStatus('Successful');
                setIsCheckComplete(true);
            }, 1000);
            setTimeout(() => {
                 setVerificationStatus('Continue...');
                 setIsVerified(true)
            }, 1500);
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans p-4">
            <div className="w-full max-w-lg text-center">
                <div className="bg-card p-10 rounded-lg border shadow-lg">
                    <div className="flex justify-center mb-6">
                        <AuthLoader />
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">{verificationStatus}</h1>
                    <p className="text-lg text-muted-foreground mb-6">This should be quick.</p>

                    {level === 'advanced' ? (
                        <div className="flex items-center space-x-2 my-6 justify-center">
                            <Checkbox id="auto-verify" checked={isCheckComplete} disabled />
                            <Label htmlFor="auto-verify" className="text-lg font-medium">Verified</Label>
                        </div>
                    ) : (
                         <div className="flex items-center space-x-2 my-6 justify-center">
                            <Checkbox
                                id="manual-verify"
                                checked={isCheckComplete}
                                onCheckedChange={handleManualCheckChange}
                                disabled={isCheckComplete}
                            />
                            <Label htmlFor="manual-verify" className="text-lg font-medium cursor-pointer">
                                Verify you are human
                            </Label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DdosVerificationPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><AuthLoader /></div>}>
            <DdosVerificationComponent />
        </Suspense>
    )
}
