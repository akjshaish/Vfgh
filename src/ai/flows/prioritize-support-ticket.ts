
'use server';

/**
 * @fileOverview This file contains a Genkit flow for prioritizing support tickets based on their urgency and impact.
 *
 * - prioritizeSupportTicket - A function that takes a support ticket as input and returns a priority score.
 * - PrioritizeSupportTicketInput - The input type for the prioritizeSupportTicket function.
 * - PrioritizeSupportTicketOutput - The return type for the prioritizeSupportTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeSupportTicketInputSchema = z.object({
  ticketTitle: z.string().describe('The title of the support ticket.'),
  ticketDescription: z.string().describe('The detailed description of the support ticket.'),
  userType: z
    .enum(['paying', 'non-paying'])
    .describe('The type of user submitting the ticket (paying or non-paying).'),
});
export type PrioritizeSupportTicketInput = z.infer<typeof PrioritizeSupportTicketInputSchema>;

const PrioritizeSupportTicketOutputSchema = z.object({
  priorityScore: z
    .number()
    .describe(
      'A numerical score indicating the priority of the ticket (higher score = higher priority).'
    ),
  reason: z
    .string()
    .describe('A short explanation of why the ticket was assigned the given priority score.'),
});
export type PrioritizeSupportTicketOutput = z.infer<typeof PrioritizeSupportTicketOutputSchema>;

export async function prioritizeSupportTicket(
  input: PrioritizeSupportTicketInput
): Promise<PrioritizeSupportTicketOutput> {
  return prioritizeSupportTicketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeSupportTicketPrompt',
  input: {schema: PrioritizeSupportTicketInputSchema},
  output: {schema: PrioritizeSupportTicketOutputSchema},
  prompt: `You are an AI assistant that helps prioritize support tickets for a web hosting company. Analyze the ticket title, description, and user type to determine the priority score. Provide a short reason for the assigned score.

Consider these factors when assigning a priority score (1-10, 10 being the highest):
- Urgency: How critical is the issue? (e.g., "website down" is more urgent than "how to change password").
- Impact: How many users are affected? Is it affecting a live production service?
- User type: Paying users should generally have higher priority than free-tier users.
- Sentiment: Is the user angry or frustrated? This might increase priority slightly.

Ticket Title: {{{ticketTitle}}}
Ticket Description: {{{ticketDescription}}}
User Type: {{{userType}}}

Respond with a priority score and a brief, helpful reason.`,
});

const prioritizeSupportTicketFlow = ai.defineFlow(
  {
    name: 'prioritizeSupportTicketFlow',
    inputSchema: PrioritizeSupportTicketInputSchema,
    outputSchema: PrioritizeSupportTicketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
