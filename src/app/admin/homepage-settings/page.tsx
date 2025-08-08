
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveHomepageSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Plan } from '../plans/page';
import { Checkbox } from '@/components/ui/checkbox';

const homepageSettingsSchema = z.object({
  message: z.string().min(1, 'Message is required.'),
  featuredPlanIds: z.array(z.string()).optional().default([]),
});

type HomepageSettingsFormData = z.infer<typeof homepageSettingsSchema>;

export default function AdminHomepageSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<HomepageSettingsFormData>({
    resolver: zodResolver(homepageSettingsSchema),
    defaultValues: {
      message: '',
      featuredPlanIds: [],
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsSnapshot, plansSnapshot] = await Promise.all([
          get(ref(db, 'settings/homepage')),
          get(ref(db, 'plans'))
        ]);

        if (settingsSnapshot.exists()) {
          reset(settingsSnapshot.val());
        }

        if (plansSnapshot.exists()) {
          const plansData = plansSnapshot.val();
          const plansArray = Object.keys(plansData).map(key => ({
            id: key,
            ...plansData[key]
          }));
          setAllPlans(plansArray);
        }

      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch homepage settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: HomepageSettingsFormData) => {
    setIsSubmitting(true);
    try {
      await saveHomepageSettings(data);
      toast({
        title: "Success",
        description: "Homepage settings have been saved successfully.",
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
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Homepage Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control the content displayed on your main index page.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Featured Content</CardTitle>
                <CardDescription>Set the marketing message and select which plans to feature.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="message">Homepage Message</Label>
                    <Input id="message" {...register('message')} placeholder="e.g., Free Hosting for Students!" />
                    {errors.message && <p className="text-destructive text-sm mt-1">{errors.message.message}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label>Featured Plans</Label>
                    <p className="text-sm text-muted-foreground">Select the plans you want to display on the homepage.</p>
                     <Controller
                        name="featuredPlanIds"
                        control={control}
                        render={({ field }) => (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                {allPlans.map((plan) => (
                                    <div key={plan.id} className="flex items-center space-x-2 p-3 rounded-md border bg-card">
                                         <Checkbox
                                            id={`plan-${plan.id}`}
                                            checked={field.value?.includes(plan.id!)}
                                            onCheckedChange={(checked) => {
                                                const newValue = checked
                                                    ? [...(field.value || []), plan.id!]
                                                    : (field.value || []).filter((id) => id !== plan.id);
                                                field.onChange(newValue);
                                            }}
                                        />
                                        <Label htmlFor={`plan-${plan.id}`} className="font-normal w-full cursor-pointer">
                                            <span className="font-medium">{plan.name}</span>
                                            <span className="text-muted-foreground"> - ₹{plan.price}/mo</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                     {errors.featuredPlanIds && <p className="text-destructive text-sm mt-1">{errors.featuredPlanIds.message}</p>}
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
