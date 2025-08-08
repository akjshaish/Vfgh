
'use server';

/**
 * @fileOverview This file contains a Genkit flow for creating a new subdomain.
 * It checks for availability, calls the cPanel API via a custom PHP script,
 * and if successful, generates and stores temporary access credentials.
 *
 * - createSubdomain - A function that handles the subdomain creation process.
 * - CreateSubdomainInput - The input type for the createSubdomain function.
 * - CreateSubdomainOutput - The return type for the createSubdomain function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, push, get, query, orderByChild, equalTo, update } from 'firebase/database';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import crypto from 'crypto';

const CreateSubdomainInputSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters long.')
    .max(30, 'Subdomain must be no more than 30 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.'),
  userId: z.string().min(1, 'User ID is required.'),
  serviceId: z.string().optional(),
});
export type CreateSubdomainInput = z.infer<typeof CreateSubdomainInputSchema>;

const CreateSubdomainOutputSchema = z.object({
  success: z.boolean().describe('Whether the subdomain reservation was successful.'),
  message: z.string().describe('A message detailing the result of the operation.'),
  subdomain: z.string().optional().describe('The full subdomain name that was reserved.'),
});
export type CreateSubdomainOutput = z.infer<typeof CreateSubdomainOutputSchema>;

// This tool calls the custom PHP API script.
const createSubdomainOnServer = ai.defineTool(
    {
        name: 'createSubdomainOnServer',
        description: 'Creates the subdomain using the custom PHP API.',
        inputSchema: z.object({
            subdomain: z.string(),
            rootDomain: z.string(),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        })
    },
    async ({ subdomain, rootDomain }) => {
        const apiUrl = 'https://inlinks.site/api/api.php';
        const docRoot = `${subdomain}.${rootDomain}`;

        const params = new URLSearchParams();
        params.append('subdomain', subdomain);
        params.append('rootdomain', rootDomain);
        params.append('dir', docRoot);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: params,
            });

            if (!response.ok) {
                return { success: false, message: `API call failed with status ${response.status}.` };
            }

            const responseText = await response.text();
            
            try {
                const data = JSON.parse(responseText);
                if (data && data.status === 1) {
                    return { success: true, message: 'Subdomain created successfully via API.' };
                }
                const errorMessage = data?.errors?.[0] || 'Unknown API error during creation.';
                return { success: false, message: `API Error: ${errorMessage}` };
            } catch (e) {
                return { success: false, message: `Failed to parse API response: ${responseText}` };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { success: false, message: `An exception occurred while calling the API: ${errorMessage}` };
        }
    }
);

export async function createSubdomain(input: CreateSubdomainInput): Promise<CreateSubdomainOutput> {
  const validatedInput = CreateSubdomainInputSchema.safeParse(input);
  if (!validatedInput.success) {
      throw new Error(`Invalid input: ${JSON.stringify(validatedInput.error.flatten().fieldErrors)}`);
  }
  return await createSubdomainFlow(validatedInput.data);
}

const createSubdomainFlow = ai.defineFlow(
  {
    name: 'createSubdomainFlow',
    inputSchema: CreateSubdomainInputSchema,
    outputSchema: CreateSubdomainOutputSchema,
  },
  async (input) => {
    
    const domainSettingsRef = ref(db, 'settings/domain');
    const domainSnapshot = await get(domainSettingsRef);
    if (!domainSnapshot.exists() || !domainSnapshot.val().domain) {
        return { success: false, message: 'The main domain is not configured by the administrator.' };
    }
    const domainToUse = domainSnapshot.val().domain;
    const fullSubdomain = `${input.subdomain}.${domainToUse}`;

    // 1. Check if the subdomain already exists in our DB
    const subdomainsRef = ref(db, 'subdomains');
    const existingSubdomainQuery = query(subdomainsRef, orderByChild('subdomain'), equalTo(fullSubdomain));
    const existingSnapshot = await get(existingSubdomainQuery);

    if (existingSnapshot.exists()) {
        return {
            success: false,
            message: `The subdomain '${fullSubdomain}' is already taken. Please choose another one.`,
        };
    }

    // 2. Call the server to create the subdomain
    const creationResult = await createSubdomainOnServer({ subdomain: input.subdomain, rootDomain: domainToUse });
    if (!creationResult.success) {
        return { success: false, message: creationResult.message };
    }

    // 3. Generate credentials
    const password = crypto.randomBytes(12).toString('hex');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // 4. Create database record for the subdomain
    const newSubdomainRef = push(subdomainsRef);
    await set(newSubdomainRef, {
        userId: input.userId,
        subdomain: fullSubdomain,
        createdAt: new Date().toISOString(),
        status: 'Active',
        serviceId: input.serviceId,
    });

    // 5. If a serviceId is provided, link it back and add AquaPanel credentials
    if (input.serviceId) {
        const serviceToUpdateRef = ref(db, `users/${input.userId}/services/${input.serviceId}`);
        await update(serviceToUpdateRef, { 
            subdomain: fullSubdomain,
            status: 'Active', // Set service to active
            cpanel: {
                username: input.subdomain,
                password: password,
                token: token,
                tokenExpires: tokenExpires,
            }
        });
    }
    
    return {
        success: true,
        message: `Subdomain '${fullSubdomain}' has been successfully created and is now active.`,
        subdomain: fullSubdomain,
    };
  }
);
