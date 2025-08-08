
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveAdvertisement } from '@/lib/actions';
import { useState, useTransition } from 'react';
import type { Advertisement } from './page';

export const adSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Ad name is required"),
  enabled: z.boolean().default(true),
  location: z.enum(['home', 'dashboard', 'order', 'forgot_password'], { required_error: "Location is required" }),
  type: z.enum(['closable', 'nonClosable', 'floating'], { required_error: "Ad type is required" }),
  closableAdCode: z.string().optional(),
  nonClosableAdMessage: z.string().optional(),
  nonClosableAdCode: z.string().optional(),
  nonClosableAdDuration: z.coerce.number().int().min(0, "Duration must be a positive number.").optional(),
  floatingAdMessage: z.string().optional(),
}).refine(data => {
    if (data.type === 'closable') return !!data.closableAdCode;
    return true;
}, { message: "Ad code is required for closable ads.", path: ["closableAdCode"] })
.refine(data => {
    if (data.type === 'nonClosable') return !!data.nonClosableAdCode;
    return true;
}, { message: "Ad code is required for non-closable ads.", path: ["nonClosableAdCode"] })
.refine(data => {
    if (data.type === 'floating') return !!data.floatingAdMessage;
    return true;
}, { message: "Message is required for floating ads.", path: ["floatingAdMessage"] });


type AdFormData = z.infer<typeof adSchema>;

interface AdFormProps {
  ad?: Advertisement | null;
  onSuccess: () => void;
}

export function AdvertisementForm({ ad, onSuccess }: AdFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: ad || {
      name: '',
      enabled: true,
      type: 'closable',
      location: 'dashboard',
      closableAdCode: '',
      nonClosableAdCode: '',
      nonClosableAdMessage: '',
      nonClosableAdDuration: 5,
      floatingAdMessage: '',
    },
  });

  const watchType = watch('type');

  const onSubmit = async (data: AdFormData) => {
    setIsSubmitting(true);
    try {
      await saveAdvertisement(data);
      toast({
        title: "Success",
        description: `Advertisement "${data.name}" has been saved.`,
      });
      onSuccess();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save advertisement. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="space-y-2">
        <Label htmlFor="name">Advertisement Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., Black Friday Banner (Homepage)" />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
      </div>

       <div className="flex items-center space-x-2">
            <Controller
                control={control}
                name="enabled"
                render={({ field }) => (
                     <Switch
                        id="enabled"
                        checked={field.value}
                        onCheckedChange={(value) => {
                            startTransition(() => {
                                field.onChange(value);
                            });
                        }}
                    />
                )}
            />
            <Label htmlFor="enabled">Enable this advertisement</Label>
        </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Type</Label>
                 <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select ad type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="closable">Closable</SelectItem>
                                <SelectItem value="nonClosable">Non-Closable (Auto-Hide)</SelectItem>
                                <SelectItem value="floating">Floating Box (5 seconds)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.type && <p className="text-destructive text-sm mt-1">{errors.type.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>Location</Label>
                 <Controller
                    control={control}
                    name="location"
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select display location" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="home">Homepage (Index)</SelectItem>
                                <SelectItem value="dashboard">User Dashboard</SelectItem>
                                <SelectItem value="order">Order Page</SelectItem>
                                <SelectItem value="forgot_password">Forgot Password Page</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.location && <p className="text-destructive text-sm mt-1">{errors.location.message}</p>}
            </div>
      </div>
     
      {watchType === 'closable' && (
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="closableAdCode">Advertisement Code (HTML/JS)</Label>
          <Textarea id="closableAdCode" {...register('closableAdCode')} rows={6} placeholder="<p>Your ad content here...</p>" />
          {errors.closableAdCode && <p className="text-destructive text-sm mt-1">{errors.closableAdCode.message}</p>}
        </div>
      )}

      {watchType === 'nonClosable' && (
        <div className="space-y-6 pt-4 border-t">
          <div className="space-y-2">
              <Label htmlFor="nonClosableAdMessage">Header Message (Optional)</Label>
              <Input id="nonClosableAdMessage" {...register('nonClosableAdMessage')} placeholder="e.g., A special announcement!" />
          </div>
          <div className="space-y-2">
              <Label htmlFor="nonClosableAdCode">Advertisement Code (HTML/JS)</Label>
              <Textarea id="nonClosableAdCode" {...register('nonClosableAdCode')} rows={6} placeholder="<p>Your ad content here...</p>" />
              {errors.nonClosableAdCode && <p className="text-destructive text-sm mt-1">{errors.nonClosableAdCode.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="nonClosableAdDuration">Visibility Duration (seconds)</Label>
              <Input id="nonClosableAdDuration" type="number" {...register('nonClosableAdDuration')} />
              {errors.nonClosableAdDuration && <p className="text-destructive text-sm mt-1">{errors.nonClosableAdDuration.message}</p>}
          </div>
        </div>
      )}

      {watchType === 'floating' && (
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="floatingAdMessage">Floating Box Message</Label>
          <Textarea id="floatingAdMessage" {...register('floatingAdMessage')} rows={3} placeholder="Your brief announcement..." />
          {errors.floatingAdMessage && <p className="text-destructive text-sm mt-1">{errors.floatingAdMessage.message}</p>}
          <p className="text-xs text-muted-foreground">This will appear in a small floating box at the top of the page for 5 seconds.</p>
        </div>
      )}


      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ad?.id ? 'Save Changes' : 'Create Advertisement'}
        </Button>
      </div>
    </form>
  );
}
