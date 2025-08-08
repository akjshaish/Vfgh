
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { saveInvoiceSettings } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const invoiceSettingsSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
  country: z.string().min(1, "Country is required"),
  taxId: z.string().optional(),
});

type InvoiceSettingsFormData = z.infer<typeof invoiceSettingsSchema>;

export default function AdminInvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      companyName: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      taxId: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/invoice');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          reset(snapshot.val());
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch invoice settings.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: InvoiceSettingsFormData) => {
    try {
      await saveInvoiceSettings(data);
      toast({
        title: "Success",
        description: "Invoice settings have been saved successfully.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
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
        <h1 className="text-3xl font-bold font-headline">Invoice Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the company details that appear on all invoices.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>This information will be displayed on all generated invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" {...register('companyName')} />
                    {errors.companyName && <p className="text-destructive text-sm mt-1">{errors.companyName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...register('address')} />
                    {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register('city')} />
                        {errors.city && <p className="text-destructive text-sm mt-1">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" {...register('postalCode')} />
                        {errors.postalCode && <p className="text-destructive text-sm mt-1">{errors.postalCode.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" {...register('country')} />
                        {errors.country && <p className="text-destructive text-sm mt-1">{errors.country.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID (e.g., GSTIN, VAT Number)</Label>
                    <Input id="taxId" {...register('taxId')} />
                    {errors.taxId && <p className="text-destructive text-sm mt-1">{errors.taxId.message}</p>}
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
