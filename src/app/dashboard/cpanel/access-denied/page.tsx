
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');

    return (
        <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md border-destructive">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        You do not have permission to access the control panel for
                        <strong className="text-foreground mx-1">{domain || 'this domain'}</strong>.
                        Please ensure you are logged into the correct account.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">
                            Return to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
