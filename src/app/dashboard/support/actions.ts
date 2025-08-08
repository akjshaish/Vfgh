'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, get, set, push } from 'firebase/database';
import {
  prioritizeSupportTicket,
  type PrioritizeSupportTicketOutput,
} from '@/ai/flows/prioritize-support-ticket';
import { revalidatePath } from 'next/cache';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  userType: z.enum(['paying', 'non-paying']),
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email(),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  isError: boolean;
  result?: PrioritizeSupportTicketOutput;
  ticketId?: string;
};

export async function handleTicketSubmission(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {

  const userId = formData.get('userId') as string;
  if (!userId) {
    return { message: 'You must be logged in to submit a ticket.', isError: true };
  }

  // Determine if the user is a paying customer
  const userServicesRef = ref(db, `users/${userId}/services`);
  const userServicesSnap = await get(userServicesRef);
  let userType: 'paying' | 'non-paying' = 'non-paying';

  if (userServicesSnap.exists()) {
    const services = userServicesSnap.val();
    for (const serviceId in services) {
      if (services[serviceId].price > 0) {
        userType = 'paying';
        break;
      }
    }
  }

  const validatedFields = ticketSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    userType: userType,
    userId: formData.get('userId'),
    userEmail: formData.get('userEmail'),
  });

  if (!validatedFields.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(validatedFields.error.flatten().fieldErrors)) {
        fields[key] = validatedFields.error.flatten().fieldErrors[key]!.join(', ');
    }
    return {
      message: "Validation failed. Please check your input.",
      fields,
      isError: true,
    };
  }

  try {
    const result = await prioritizeSupportTicket({
      ticketTitle: validatedFields.data.title,
      ticketDescription: validatedFields.data.description,
      userType: validatedFields.data.userType,
    });
    
    const ticketsRef = ref(db, 'tickets');
    const newTicketRef = push(ticketsRef);
    await set(newTicketRef, {
        userId: validatedFields.data.userId,
        userEmail: validatedFields.data.userEmail,
        ticketTitle: validatedFields.data.title,
        ticketDescription: validatedFields.data.description,
        priorityScore: result.priorityScore,
        reason: result.reason,
        status: 'Open',
        createdAt: new Date().toISOString(),
        replies: {},
    });
    
    revalidatePath('/dashboard/support/tickets');
    revalidatePath('/admin/tickets');

    return {
      message: 'Ticket submitted and prioritized successfully!',
      isError: false,
      result,
      ticketId: newTicketRef.key || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return {
      message: errorMessage,
      isError: true,
    };
  }
}
