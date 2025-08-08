

'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { handleSubdomainCreation, type SubdomainFormState } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Rocket, Loader2 } from 'lucide-react';
import { motion } from "framer-motion";
import { useEffect as useReactEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const initialState: SubdomainFormState = {
  message: '',
  isError: false,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto">
        {pending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
            </>
        ) : (
            <>
                <Rocket className="mr-2 h-4 w-4" />
                Reserve Subdomain
            </>
        )}
    </Button>
  );
}

export function SubdomainForm({ serviceId }: { serviceId?: string }) {
  const [state, formAction] = useActionState(handleSubdomainCreation, initialState);
  const [domain, setDomain] = useState<string | null>(null);
  const [loadingDomain, setLoadingDomain] = useState(true);
  const { userId } = useAuth();
  const { toast } = useToast();

  useReactEffect(() => {
    const fetchDomain = async () => {
        try {
            const settingsRef = ref(db, 'settings/domain');
            const snapshot = await get(settingsRef);
            if (snapshot.exists() && snapshot.val().domain) {
                setDomain(snapshot.val().domain);
            } else {
                setDomain(null);
            }
        } catch (error) {
            console.error("Failed to fetch domain", error);
            setDomain(null);
        } finally {
            setLoadingDomain(false);
        }
    }
    fetchDomain();
  }, []);

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.isError ? "destructive" : "default",
        title: state.isError ? "Error" : "Success",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={userId || ''} />
      {serviceId && <input type="hidden" name="serviceId" value={serviceId} />}
      <div className="space-y-2">
        <Label htmlFor="subdomain" className="sr-only">Subdomain</Label>
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
                <Input 
                    id="subdomain" 
                    name="subdomain" 
                    placeholder="your-awesome-site" 
                    required 
                    className="pr-[180px] h-12 text-base"
                    disabled={loadingDomain || !domain}
                />
                 <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                    {loadingDomain ? (
                        <Skeleton className="h-4 w-32" />
                    ): domain ? (
                        <>.{domain}</>
                    ) : (
                        <span className="text-destructive text-xs font-medium">Domain not configured</span>
                    )}
                </span>
            </div>
             <SubmitButton disabled={loadingDomain || !domain} />
        </div>
        {state.fields?.subdomain && (
          <p className="text-sm text-destructive mt-2">{state.fields.subdomain}</p>
        )}
      </div>

       {state.message && (
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant={state.isError ? 'destructive' : 'default'} className="mt-4">
            {state.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertTitle>{state.isError ? 'Error' : 'Success'}</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
            </Alert>
         </motion.div>
      )}

    </form>
  );
}
