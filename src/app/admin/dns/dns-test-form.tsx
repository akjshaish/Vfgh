
'use client';

import { useState } from 'react';
import { createSubdomain, type CreateSubdomainOutput } from '@/ai/flows/create-subdomain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DnsTestFormProps {
    domain?: string;
}

export function DnsTestForm({ domain }: DnsTestFormProps) {
    const [subdomain, setSubdomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CreateSubdomainOutput | null>(null);

    const handleTest = async () => {
        if (!subdomain) return;
        setIsLoading(true);
        setResult(null);
        try {
            // Directly call the flow, marking it as a test run.
            // A placeholder userId is required to pass schema validation.
            const response = await createSubdomain({ subdomain, isTest: true, userId: 'admin-test-user' });
            setResult(response);
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during the test.';
            setResult({
                success: false,
                message: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="test-subdomain">Subdomain to Test</Label>
                    <div className="flex items-center">
                        <Input 
                            id="test-subdomain"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value)}
                            placeholder="e.g., test-site"
                            disabled={isLoading}
                            className="rounded-r-none"
                        />
                         {domain && (
                            <span className="flex h-10 items-center rounded-r-md border border-l-0 border-input bg-secondary px-3 text-muted-foreground">
                                .{domain}
                            </span>
                        )}
                    </div>
                </div>
                <Button onClick={handleTest} disabled={isLoading || !subdomain}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Testing...' : 'Test'}
                </Button>
            </div>

            {result && (
                <Alert variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{result.success ? 'Test Passed' : 'Test Failed'}</AlertTitle>
                    <AlertDescription>
                        {result.message}
                        {result.success && result.subdomain && ` (Full domain: ${result.subdomain})`}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
