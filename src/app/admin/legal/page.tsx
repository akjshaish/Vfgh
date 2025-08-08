
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveLegalContent } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const legalContentSchema = z.object({
  terms: z.string().min(1, 'Terms of Service content is required.'),
  privacy: z.string().min(1, 'Privacy Policy content is required.'),
});

type LegalContentFormData = z.infer<typeof legalContentSchema>;

export default function AdminLegalPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LegalContentFormData>({
    resolver: zodResolver(legalContentSchema),
    defaultValues: {
      terms: '',
      privacy: '',
    },
  });

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const legalRef = ref(db, 'settings/legal');
        const snapshot = await get(legalRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch legal content.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [reset, toast]);

  const onSubmit = async (data: LegalContentFormData) => {
    setIsSubmitting(true);
    try {
      await saveLegalContent(data);
      toast({
        title: "Success",
        description: "Legal content has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save content. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Legal Content Management</h1>
        <p className="text-sm text-muted-foreground">
          Edit the content for your Terms of Service and Privacy Policy pages.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
            <CardDescription>Content for the /terms-of-service page. Supports Markdown.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="terms" className="sr-only">Terms of Service Content</Label>
            <Textarea
              id="terms"
              {...register('terms')}
              rows={20}
              placeholder="Enter your terms of service here..."
              className="font-mono text-sm"
            />
            {errors.terms && <p className="text-destructive text-sm mt-2">{errors.terms.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
            <CardDescription>Content for the /privacy-policy page. Supports Markdown.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="privacy" className="sr-only">Privacy Policy Content</Label>
            <Textarea
              id="privacy"
              {...register('privacy')}
              rows={20}
              placeholder="Enter your privacy policy here..."
              className="font-mono text-sm"
            />
            {errors.privacy && <p className="text-destructive text-sm mt-2">{errors.privacy.message}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
