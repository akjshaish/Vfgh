
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServicePlan } from './page';
import { useRouter } from 'next/navigation';
import { saveServicePlan, type ServiceFormState } from './actions';

const servicePlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Plan name is required"),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Price must be a positive number")
  ),
  websites: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int("Must be a whole number").min(-1, "Limit cannot be less than -1")
  ),
  storage: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int("Must be a whole number").min(0, "Storage cannot be less than 0")
  ),
  features: z.array(z.string().min(1, "Feature cannot be empty")).min(1, "At least one feature is required"),
});

type ServicePlanFormData = z.infer<typeof servicePlanSchema>;

interface ServicePlanFormProps {
  plan?: ServicePlan | null;
}

const initialState: ServiceFormState = {
  message: '',
  isError: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Saving...' : 'Save Plan'}
    </Button>
  );
}


export function ServicePlanForm({ plan }: ServicePlanFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(saveServicePlan, initialState);

  const {
    register,
    control,
    formState: { errors },
  } = useForm<ServicePlanFormData>({
    resolver: zodResolver(servicePlanSchema),
    defaultValues: {
      id: plan?.id,
      name: plan?.name || '',
      price: plan?.price || 0,
      websites: plan?.websites ?? 1,
      storage: plan?.storage || 100, // Default to 100MB
      features: plan?.features && plan.features.length > 0 ? plan.features : [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "features",
  });

   useEffect(() => {
    if (state.message && state.isError) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);


  return (
    <form action={formAction} className="space-y-6">
       <input type="hidden" {...register('id')} />
      <div className="space-y-2">
        <Label htmlFor="name">Plan Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
         {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
            <Label htmlFor="price">Price (₹/mo)</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            {state?.errors?.price && <p className="text-sm text-destructive">{state.errors.price}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="websites">Website/Subdomain Limit</Label>
            <Input id="websites" type="number" {...register("websites")} />
            <p className="text-xs text-muted-foreground">Use -1 for unlimited.</p>
            {errors.websites && <p className="text-sm text-destructive">{errors.websites.message}</p>}
            {state?.errors?.websites && <p className="text-sm text-destructive">{state.errors.websites}</p>}
        </div>
         <div className="space-y-2">
            <Label htmlFor="storage">Storage (in MB)</Label>
            <Input id="storage" type="number" {...register("storage")} />
            <p className="text-xs text-muted-foreground">e.g., 1024 for 1GB.</p>
            {errors.storage && <p className="text-sm text-destructive">{errors.storage.message}</p>}
            {state?.errors?.storage && <p className="text-sm text-destructive">{state.errors.storage}</p>}
        </div>
      </div>
      <div>
        <Label>Features</Label>
        <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
                <Input {...register(`features.${index}` as const)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash className="h-4 w-4" />
                </Button>
            </div>
            ))}
        </div>
        {errors.features && <p className="text-sm text-destructive mt-1">{errors.features.message || errors.features.root?.message}</p>}
        {state?.errors?.features && <p className="text-sm text-destructive mt-1">{state.errors.features}</p>}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append("")}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
