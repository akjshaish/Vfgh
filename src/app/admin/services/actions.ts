
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, push } from 'firebase/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export type ServiceFormState = {
    message: string;
    errors?: Record<string, string | string[]>;
    isError: boolean;
};

export async function saveServicePlan(prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const validatedPlan = servicePlanSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    price: formData.get('price'),
    websites: formData.get('websites'),
    storage: formData.get('storage'),
    features: formData.getAll('features'),
  });

  if (!validatedPlan.success) {
    const fieldErrors = validatedPlan.error.flatten().fieldErrors;
    console.log(fieldErrors);
    return {
      message: 'Validation failed. Please check the form.',
      errors: fieldErrors,
      isError: true,
    };
  }

  const { id, ...planData } = validatedPlan.data;

  try {
    const planRef = id ? ref(db, `plans/${id}`) : push(ref(db, 'plans'));
    await set(planRef, planData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Could not save the plan to the database.";
    return {
        message: errorMessage,
        isError: true,
    }
  }

  revalidatePath('/admin/services');
  redirect('/admin/services');
}
