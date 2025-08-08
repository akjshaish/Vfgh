
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveDomainSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const domainSettingsSchema = z.object({
  domain: z.string().min(1, 'Domain name is required.'),
});

type DomainSettingsFormData = z.infer<typeof domainSettingsSchema>;

export default function AdminDomainSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DomainSettingsFormData>({
    resolver: zodResolver(domainSettingsSchema),
    defaultValues: {
      domain: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/domain');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch domain settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: DomainSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveDomainSettings(data);
      toast({
        title: "Success",
        description: "Domain settings have been saved successfully.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Domain Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the primary domain for your service.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Main Domain</CardTitle>
                <CardDescription>This is the domain under which all user subdomains will be created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="domain">Domain Name</Label>
                    <Input id="domain" {...register('domain')} placeholder="example.com" />
                    {errors.domain && <p className="text-destructive text-sm mt-1">{errors.domain.message}</p>}
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
