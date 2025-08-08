
'use server';

import { z } from 'zod';
import {
  createSubdomain,
  type CreateSubdomainOutput,
} from '@/ai/flows/create-subdomain';
import { db } from './firebase';
import { ref, set, push, update, get, remove, query, orderByChild, equalTo } from 'firebase/database';
import type { Plan } from '@/app/admin/services/page';
import { headers } from 'next/headers';
import { sendEmail } from './email';
import crypto from 'crypto';
import type { Advertisement } from '@/app/admin/advertisement/page';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import type { Invoice } from '@/app/dashboard/billing/page';


// Subdomain Creation Action
const subdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters long.')
    .max(30, 'Subdomain must be no more than 30 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.'),
  userId: z.string().min(1, 'User ID is required.'),
  serviceId: z.string().optional(),
});

export type SubdomainFormState = {
    message: string;
    fields?: Record<string, string>;
    isError: boolean;
    result?: CreateSubdomainOutput;
};

export async function handleSubdomainCreation(
    prevState: SubdomainFormState,
    formData: FormData
): Promise<SubdomainFormState> {
    const validatedFields = subdomainSchema.safeParse({
        subdomain: formData.get('subdomain'),
        userId: formData.get('userId'),
        serviceId: formData.get('serviceId'),
    });

    if (!validatedFields.success) {
        const fields: Record<string, string> = {};
        for (const key of Object.keys(validatedFields.error.flatten().fieldErrors)) {
            fields[key] = validatedFields.error.flatten().fieldErrors[key]!.join(', ');
        }
        return {
            message: "Validation failed. Please check the form.",
            fields,
            isError: true,
        };
    }
    
    const { userId, subdomain, serviceId } = validatedFields.data;

    try {
        const result = await createSubdomain({ userId, subdomain, serviceId });

        if (result.success && result.subdomain) {
             revalidatePath('/dashboard/subdomains');
             if (serviceId) {
                revalidatePath(`/dashboard/services/${serviceId}`);
            }
        }
       
        return {
            message: result.message,
            isError: !result.success,
            result,
        };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.';
        return {
            message: errorMessage,
            isError: true,
        };
    }
}


// Order Service Action
interface OrderServicePayload {
    plan: Plan;
    userId: string;
    paymentMethod: string;
}

export async function orderService({ plan, userId, paymentMethod }: OrderServicePayload): Promise<{serviceId: string, [key: string]: any}> {
    if (!userId || !plan || !plan.id) {
        throw new Error("User ID and Plan are required to place an order.");
    }

    const isFreePlan = plan.price === 0;

    // Check free user restriction
    if (isFreePlan) {
        const restrictionsRef = ref(db, 'settings/restrictions');
        const restrictionsSnap = await get(restrictionsRef);
        if (restrictionsSnap.exists() && restrictionsSnap.val().freeUserLimitEnabled) {
            const userServicesRef = ref(db, `users/${userId}/services`);
            const userServicesSnap = await get(userServicesRef);
            if (userServicesSnap.exists()) {
                const services = userServicesSnap.val();
                const hasExistingFreeService = Object.values(services).some((service: any) => service.price === 0);
                if (hasExistingFreeService) {
                    throw new Error("You have reached the limit for free services. You can only have one free service at a time.");
                }
            }
        }
    }
    
    const serviceRef = ref(db, `users/${userId}/services`);
    const newServiceRef = push(serviceRef);
    const serviceId = newServiceRef.key;
    if (!serviceId) throw new Error("Failed to generate a unique service ID.");

    // Determine status based on price
    const status = isFreePlan ? 'Active' : 'Pending';

    const { id, ...planDetails } = plan;
    const serviceData = {
        ...planDetails,
        id: serviceId, // Store the service ID within the service object itself
        planId: id,
        orderDate: new Date().toISOString(),
        status: status,
    };

    await set(newServiceRef, serviceData);
    
    // Now create an invoice for this service
    const invoicesRef = ref(db, 'invoices');
    const newInvoiceRef = push(invoicesRef);
    
    // Fetch user and company details for the invoice
    const userSnap = await get(ref(db, `users/${userId}`));
    const companySnap = await get(ref(db, 'settings/invoice'));

    const userDetails = userSnap.exists() ? { email: userSnap.val().email, name: userSnap.val().name || 'Valued Customer' } : { email: 'N/A', name: 'Valued Customer' };
    const companyDetails = companySnap.exists() ? companySnap.val() : {};


    const invoiceData: Omit<Invoice, 'id'> = {
        userId: userId,
        serviceId: serviceId,
        serviceName: plan.name,
        amount: plan.price,
        status: isFreePlan ? 'Paid' : 'Unpaid',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        userEmail: userDetails.email,
        companyDetails: companyDetails,
        userDetails: userDetails,
    };
    
    await set(newInvoiceRef, invoiceData);

    revalidatePath('/dashboard/services');
    revalidatePath('/dashboard/billing');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/invoices');

    return { serviceId, ...serviceData };
}

// User Status Action
export async function updateUserStatus(userId: string, status: 'Active' | 'Suspended') {
    if (!userId) {
        throw new Error("User ID is required.");
    }
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { status });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
}

// Service Status Action
export async function updateServiceStatus(userId: string, serviceId: string, status: 'Active' | 'Suspended' | 'Terminated' | 'Banned' | 'Pending Activation' | 'Pending') {
    if (!userId || !serviceId) {
        throw new Error("User ID and Service ID are required.");
    }
    const serviceRef = ref(db, `users/${userId}/services/${serviceId}`);
    await update(serviceRef, { status });

    // Also update the related invoice status
     if (status === 'Active') {
        const invoicesQuery = query(ref(db, 'invoices'), orderByChild('serviceId'), equalTo(serviceId));
        const invoiceSnapshot = await get(invoicesQuery);
        if (invoiceSnapshot.exists()) {
            const invoiceData = invoiceSnapshot.val();
            const invoiceKey = Object.keys(invoiceData)[0];
            await update(ref(db, `invoices/${invoiceKey}`), { status: 'Paid' });
        }
    }

    revalidatePath(`/admin/orders`);
    revalidatePath(`/dashboard/services/${serviceId}`);
    revalidatePath(`/dashboard/billing`);
    revalidatePath(`/admin/invoices`);
}

// Domain Settings Action
const domainSettingsSchema = z.object({
  domain: z.string().min(1, "Domain name is required."),
});

export async function saveDomainSettings(data: z.infer<typeof domainSettingsSchema>) {
    const validatedData = domainSettingsSchema.parse(data);
    const settingsRef = ref(db, 'settings/domain');
    await set(settingsRef, validatedData);
}


// cPanel/DNS Settings Action
const dnsSettingsSchema = z.object({
  autoDnsEnabled: z.boolean(),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  username: z.string().optional(),
  apiToken: z.string().optional(),
  testModeEnabled: z.boolean(),
});

export async function saveDnsSettings(data: z.infer<typeof dnsSettingsSchema>) {
    const validatedData = dnsSettingsSchema.parse(data);
    
    const settingsRef = ref(db, 'settings/dns');
    await update(settingsRef, validatedData);
}

// Maintenance Settings Action
const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['full', 'partial']),
  fullMessage: z.string().optional(),
  partialMessage: z.string().optional(),
  serverOverloadEnabled: z.boolean(),
  serverOverloadMessage: z.string().optional(),
});

export async function saveMaintenanceSettings(data: z.infer<typeof maintenanceSettingsSchema>) {
    const validatedData = maintenanceSettingsSchema.parse(data);
    const settingsRef = ref(db, 'settings/maintenance');
    await set(settingsRef, validatedData);
}

// Security Settings Action
const securitySettingsSchema = z.object({
  multiLoginProtectionEnabled: z.boolean().optional(),
  antiVpnEnabled: z.boolean().optional(),
  ipinfoApiToken: z.string().optional(),
  appCheckEnabled: z.boolean().optional(),
  reCaptchaSiteKey: z.string().optional(),
  ddosProtectionLevel: z.enum(['normal', 'advanced', 'maximum']).optional(),
});

export async function saveSecuritySettings(data: z.infer<typeof securitySettingsSchema>) {
    const validatedData = securitySettingsSchema.parse(data);
    const settingsRef = ref(db, 'settings/security');
    await update(settingsRef, validatedData);
}


// Auth Logs Actions
interface LogAuthEventPayload {
  email: string;
  action: 'Login' | 'Register' | 'Verification';
}

export async function logAuthEvent({ email, action }: LogAuthEventPayload) {
  try {
    const ip = headers().get('x-forwarded-for') ?? 'IP not found';
    const logData = {
      email,
      action,
      ip,
      timestamp: new Date().toISOString(),
    };
    const logsRef = ref(db, 'auth_logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, logData);
  } catch (error) {
    console.error("Failed to log auth event:", error);
    // We don't throw an error here to not interrupt the user flow
  }
}

export async function clearAuthLogs() {
    try {
        const logsRef = ref(db, 'auth_logs');
        await remove(logsRef);
    } catch (error) {
        console.error("Failed to clear auth logs:", error);
        throw new Error("Could not clear authentication logs from the database.");
    }
}

// Registration Action
const registrationSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // path of error
});

export type RegistrationFormState = {
    message: string;
    errors?: Record<string, string>;
    isError: boolean;
    success?: boolean;
    pending?: boolean;
    requiresVerification?: boolean;
    email?: string;
};

export async function handleRegistration(
    prevState: RegistrationFormState,
    formData: FormData
): Promise<RegistrationFormState> {
    const validatedFields = registrationSchema.safeParse(Object.fromEntries(formData));
    
    if (!validatedFields.success) {
        const errors: Record<string, string> = {};
        for (const [key, value] of Object.entries(validatedFields.error.flatten().fieldErrors)) {
            errors[key] = value.join(', ');
        }
        return {
            message: "Validation failed.",
            errors,
            isError: true,
        };
    }
    
    const { email, password } = validatedFields.data;
    const ip = headers().get('x-forwarded-for') ?? '127.0.0.1'; // Fallback for local dev
    
    try {
        const securitySettingsRef = ref(db, 'settings/security');
        const securitySnapshot = await get(securitySettingsRef);
        const securitySettings = securitySnapshot.val() || {};

        if (securitySettings.multiLoginProtectionEnabled) {
            const logsRef = ref(db, 'auth_logs');
            const ipLogsSnapshot = await get(query(logsRef, orderByChild('ip'), equalTo(ip)));
            if(ipLogsSnapshot.exists()) {
                const logs = ipLogsSnapshot.val();
                const registrationExists = Object.values(logs).some((log: any) => log.action === 'Register');
                 if (registrationExists) {
                    return { message: "An account has already been registered from this IP address.", isError: true };
                }
            }
        }

        if (securitySettings.antiVpnEnabled && securitySettings.ipinfoApiToken) {
            try {
                const response = await fetch(`https://ipinfo.io/${ip}/json?token=${securitySettings.ipinfoApiToken}`);
                if (!response.ok) {
                    console.warn(`IPinfo API call failed with status: ${response.status}`);
                    // Optionally proceed or block, for now we proceed but log a warning
                } else {
                    const ipData = await response.json();
                    if (ipData.privacy?.vpn || ipData.privacy?.proxy || ipData.privacy?.hosting) {
                        return { message: "Registrations from VPNs, proxies, or hosting services are not allowed.", isError: true };
                    }
                }
            } catch (ipinfoError) {
                 console.error("IPinfo API check failed:", ipinfoError);
                 // Decide whether to block or allow if the check fails. For now, allow but log.
            }
        }
        
        const usersRef = ref(db, 'users');
        const userQuery = query(usersRef, orderByChild('email'), equalTo(email));
        const userSnapshot = await get(userQuery);
        if (userSnapshot.exists()) {
            return { message: "An account with this email already exists.", isError: true };
        }
        
        const smtpSettingsRef = ref(db, 'settings/smtp');
        const smtpSnapshot = await get(smtpSettingsRef);
        const requireVerification = smtpSnapshot.exists() ? smtpSnapshot.val().requireVerification : true;

        const newUserRef = push(usersRef);
        const newUser = {
            email: email,
            password: password, // In a real app, this should be hashed
            createdAt: new Date().toISOString(),
            status: requireVerification ? 'Pending' : 'Active'
        };
        await set(newUserRef, newUser);

        await logAuthEvent({ email, action: 'Register' });
        
        if (requireVerification) {
            await handleLoginVerification(email, 'verification');
            return {
                message: "Account created! We've sent a verification code to your email.",
                isError: false,
                success: true,
                requiresVerification: true,
                email: email
            };
        }
        
        return { message: 'Account created successfully! Redirecting to login...', isError: false, success: true };

    } catch (error) {
        console.error("Registration Error:", error);
        return { message: `Failed to create account: ${error instanceof Error ? error.message : 'Please try again later.'}`, isError: true };
    }
}


// SMTP Settings Action
const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP Host is required'),
  smtpPort: z.coerce.number().int().min(1, "Port must be a positive number"),
  smtpUser: z.string().email('A valid email address is required for the username'),
  smtpPass: z.string().optional(),
  requireVerification: z.coerce.boolean(),
});

export type SmtpFormState = {
    message: string;
    errors?: Record<string, string>;
    isError: boolean;
};

export async function saveSmtpSettings(prevState: SmtpFormState, formData: FormData): Promise<SmtpFormState> {
    const settingsData = {
        smtpHost: formData.get('smtpHost'),
        smtpPort: formData.get('smtpPort'),
        smtpUser: formData.get('smtpUser'),
        smtpPass: formData.get('smtpPass'),
        requireVerification: formData.get('requireVerification') === 'on',
    };

    const validatedFields = smtpSettingsSchema.safeParse(settingsData);

    if (!validatedFields.success) {
        const errors: Record<string, string> = {};
        for (const [key, value] of Object.entries(validatedFields.error.flatten().fieldErrors)) {
            errors[key] = value.join(', ');
        }
        return {
            message: "Validation failed. Please check the form.",
            errors,
            isError: true,
        };
    }

    try {
        const settingsRef = ref(db, 'settings/smtp');
        
        // If password is blank, we don't want to overwrite the existing one.
        const currentSettingsSnap = await get(settingsRef);
        const currentSettings = currentSettingsSnap.val() || {};

        const dataToSave = { ...validatedFields.data };
        if (!dataToSave.smtpPass) {
            dataToSave.smtpPass = currentSettings.smtpPass || '';
        }
        
        await set(settingsRef, dataToSave);
        return { message: 'SMTP settings saved successfully!', isError: false };
    } catch (error) {
        console.error(error);
        return { message: 'Failed to save SMTP settings.', isError: true };
    }
}


export async function handleLoginVerification(email: string, type: 'login' | 'verification' = 'login') {
    try {
        const usersRef = ref(db, 'users');
        const q = query(usersRef, orderByChild('email'), equalTo(email));
        const snapshot = await get(q);

        if (!snapshot.exists()) {
            return { success: false, message: 'User not found.' };
        }

        const userId = Object.keys(snapshot.val())[0];
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        await update(ref(db, `users/${userId}`), {
            loginVerificationCode: verificationCode,
            loginVerificationExpires: expires
        });

        const subject = type === 'login' ? 'Your Login Verification Code' : 'Activate Your Account';
        
        await sendEmail({
            to: email,
            subject: subject,
            type: type,
            payload: {
                code: verificationCode
            }
        });

        return { success: true, message: 'Verification code sent.' };
    } catch (error) {
        console.error(`Error in handleLoginVerification for type ${type}: `, error);
        const message = error instanceof Error ? error.message : 'Failed to send verification code.';
        return { success: false, message };
    }
}


export type PasswordResetFormState = {
  message: string;
  isError: boolean;
  success?: boolean;
  email?: string;
};

const passwordResetRequestSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export async function handlePasswordResetRequest(prevState: PasswordResetFormState, formData: FormData): Promise<PasswordResetFormState> {
    const validatedFields = passwordResetRequestSchema.safeParse({
        email: formData.get('email'),
    });
    
    if (!validatedFields.success) {
        return { message: validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid input.', isError: true };
    }

    const { email } = validatedFields.data;

    try {
        const usersRef = ref(db, 'users');
        const q = query(usersRef, orderByChild('email'), equalTo(email));
        const snapshot = await get(q);

        if (!snapshot.exists()) {
            // Don't reveal if the user exists or not for security reasons.
            return { message: 'If an account with that email exists, we have sent instructions to reset your password.', isError: false, success: true, email };
        }

        const userId = Object.keys(snapshot.val())[0];
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const resetOtpExpires = Date.now() + 600000; // 10 minutes

        await update(ref(db, `users/${userId}`), {
            resetOtp,
            resetOtpExpires,
        });
        
        await sendEmail({
            to: email,
            subject: 'Your Password Reset Code',
            type: 'password-reset-otp',
            payload: {
                code: resetOtp,
            },
        });
        
        return { 
            message: 'An OTP has been sent to your email address.', 
            isError: false,
            success: true,
            email: email,
        };

    } catch (error) {
        console.error("Password Reset Request Error:", error);
        // Generic error to avoid leaking information
        return { message: 'An error occurred. Please try again later.', isError: true };
    }
}


const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export async function handlePasswordReset(prevState: PasswordResetFormState, formData: FormData): Promise<PasswordResetFormState> {
    const validatedFields = resetPasswordSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
         const errors = validatedFields.error.flatten().fieldErrors;
         const firstError = Object.values(errors)[0]?.[0] ?? 'Invalid input.';
         return { message: firstError, isError: true };
    }
    
    const { email, otp, password } = validatedFields.data;

    try {
        const usersRef = ref(db, 'users');
        const q = query(usersRef, orderByChild('email'), equalTo(email));
        const snapshot = await get(q);

        if (!snapshot.exists()) {
            return { message: 'Invalid OTP or email address.', isError: true };
        }
        
        const userId = Object.keys(snapshot.val())[0];
        const user = snapshot.val()[userId];

        if (user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
             return { message: 'Invalid or expired OTP.', isError: true };
        }

        await update(ref(db, `users/${userId}`), {
            password: password, // In a real app, this should be hashed
            resetOtp: null,
            resetOtpExpires: null,
        });

        return { message: 'Password has been reset successfully! You can now log in.', isError: false, success: true };

    } catch (error) {
        console.error("Password Reset Error:", error);
        return { message: 'An error occurred. Please try again.', isError: true };
    }
}

// Advertisement Settings Action
const adSchema = z.object({
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
});


export async function saveAdvertisement(data: z.infer<typeof adSchema>) {
    const validatedAd = adSchema.parse(data);
    const { id, ...adData } = validatedAd;
    
    const adRef = id 
        ? ref(db, `settings/advertisements/${id}`) 
        : push(ref(db, 'settings/advertisements'));

    await set(adRef, adData);
    revalidatePath('/*');
}

// Homepage Settings Action
const homepageSettingsSchema = z.object({
  message: z.string().min(1, 'Message is required.'),
  featuredPlanIds: z.array(z.string()).optional().default([]),
});

export async function saveHomepageSettings(data: z.infer<typeof homepageSettingsSchema>) {
    const validatedData = homepageSettingsSchema.parse(data);
    const settingsRef = ref(db, 'settings/homepage');
    await set(settingsRef, validatedData);
    revalidatePath('/');
}

// Update Ticket Status
export async function updateTicketStatus(ticketId: string, status: 'Open' | 'In Progress' | 'Answered' | 'Closed') {
    const ticketRef = ref(db, `tickets/${ticketId}`);
    await update(ticketRef, { status });
    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath('/admin/tickets');
}

// Post Reply
export async function postReply(ticketId: string, replyText: string, author: 'admin' | 'user', authorName: string) {
    if (!replyText.trim()) {
        throw new Error("Reply cannot be empty.");
    }

    const reply = {
        author,
        authorName,
        message: replyText,
        timestamp: new Date().toISOString(),
    };
    
    const repliesRef = ref(db, `tickets/${ticketId}/replies`);
    const newReplyRef = push(repliesRef);
    await set(newReplyRef, reply);

    // If admin replies, set status to Answered
    if (author === 'admin') {
        await updateTicketStatus(ticketId, 'Answered');
    } else {
        await updateTicketStatus(ticketId, 'In Progress');
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/dashboard/support/tickets/${ticketId}`);
}

// Admin Ticket Bulk Actions
export async function clearAllTickets() {
    const ticketsRef = ref(db, 'tickets');
    await remove(ticketsRef);
    revalidatePath('/admin/tickets');
}

export async function bulkAutoReply() {
    const ticketsRef = ref(db, 'tickets');
    const snapshot = await get(ticketsRef);

    if (snapshot.exists()) {
        const tickets = snapshot.val();
        const updates: { [key: string]: any } = {};
        const replyMessage = "Your problem will be solved within a few days.";

        for (const ticketId in tickets) {
            // Only reply to tickets that are not already closed or answered by an admin recently
            if (tickets[ticketId].status === 'Open' || tickets[ticketId].status === 'In Progress') {
                const reply = {
                    author: 'admin',
                    authorName: 'System Bot',
                    message: replyMessage,
                    timestamp: new Date().toISOString(),
                };
                
                const newReplyRef = push(ref(db, `tickets/${ticketId}/replies`));
                updates[`tickets/${ticketId}/replies/${newReplyRef.key}`] = reply;
                updates[`tickets/${ticketId}/status`] = 'Answered';
            }
        }
        
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
    }
    revalidatePath('/admin/tickets');
}


export type GatewayFormState = {
  message: string;
  errors?: Record<string, string | string[]>;
  isError: boolean;
};


// Stripe Gateway Settings Action
const stripeSettingsSchema = z.object({
  enabled: z.boolean(),
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
});

export async function saveStripeSettings(data: z.infer<typeof stripeSettingsSchema>) {
  const validatedFields = stripeSettingsSchema.parse(data);

  try {
    const settingsRef = ref(db, 'settings/gateways/stripe');
    const snapshot = await get(settingsRef);
    const existingSettings = snapshot.val() || {};

    const dataToSave = {
      enabled: validatedFields.enabled,
      publishableKey: validatedFields.publishableKey,
      // Only update secrets if they are provided, otherwise keep the old ones
      secretKey: validatedFields.secretKey || existingSettings.secretKey,
      webhookSecret: validatedFields.webhookSecret || existingSettings.webhookSecret,
    };
    
    await set(settingsRef, dataToSave);
  } catch (error) {
     console.error("Failed to save Stripe settings:", error);
     throw new Error("Could not save settings to the database.");
  }
}

// UPI Gateway Settings Action
const upiSettingsSchema = z.object({
  enabled: z.boolean(),
  upiId: z.string().optional(),
  upiName: z.string().optional(),
});

export async function saveUpiSettings(data: z.infer<typeof upiSettingsSchema>) {
    const validatedFields = upiSettingsSchema.parse(data);
    try {
        const settingsRef = ref(db, 'settings/gateways/upi');
        await set(settingsRef, validatedFields);
    } catch (error) {
        console.error("Failed to save UPI settings:", error);
        throw new Error("Could not save settings to the database.");
    }
}


// Stripe Checkout Action
export async function createStripeCheckoutSession(data: { planId: string, userId: string, serviceId: string }): Promise<{sessionId?: string, error?: string}> {
    const { planId, userId, serviceId } = data;

    try {
        const settingsRef = ref(db, 'settings/gateways/stripe');
        const settingsSnap = await get(settingsRef);
        if (!settingsSnap.exists() || !settingsSnap.val().enabled) {
            throw new Error("Stripe is not enabled.");
        }
        const { secretKey } = settingsSnap.val();

        const planRef = ref(db, `plans/${planId}`);
        const planSnap = await get(planRef);
        if (!planSnap.exists()) {
            throw new Error("Plan not found.");
        }
        const plan = planSnap.val();

        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found.");
        }
        const user = userSnap.val();

        if (!secretKey) {
            throw new Error("Stripe secret key is not configured.");
        }
        
        const stripe = new Stripe(secretKey);

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: plan.name,
                            description: `AquaHost - ${plan.name} Plan`,
                        },
                        unit_amount: plan.price * 100, // Price in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${headers().get('origin')}/dashboard/services?payment_success=true`,
            cancel_url: `${headers().get('origin')}/dashboard/order/${planId}?payment_canceled=true`,
            metadata: {
                userId: userId,
                planId: planId,
                serviceId: serviceId,
            },
            customer_email: user.email,
        });

        return { sessionId: checkoutSession.id };

    } catch (error) {
        console.error(error);
        return { error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}


const invoiceSettingsSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
  country: z.string().min(1, "Country is required"),
  taxId: z.string().optional(),
});

export async function saveInvoiceSettings(data: z.infer<typeof invoiceSettingsSchema>) {
    const validatedData = invoiceSettingsSchema.parse(data);
    await set(ref(db, 'settings/invoice'), validatedData);
    revalidatePath('/admin/invoice-settings');
}


export async function handleAquaPanelLogin(userId: string, serviceId: string) {
  if (!userId || !serviceId) {
    return { success: false, message: 'User ID and Service ID are required.' };
  }

  const serviceRef = ref(db, `users/${userId}/services/${serviceId}`);
  const serviceSnap = await get(serviceRef);

  if (!serviceSnap.exists()) {
    return { success: false, message: 'Service not found.' };
  }

  const service = serviceSnap.val();
  const fullSubdomain = service.subdomain;
  if (!fullSubdomain) {
    return { success: false, message: 'No subdomain is assigned to this service.' };
  }

  // The username for the panel is just the subdomain part, not the full domain.
  const username = fullSubdomain.split('.')[0];
  
  // Generate new credentials
  const password = crypto.randomBytes(12).toString('hex');
  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now in seconds

  // Save credentials to the `/pannelneed` path for your PHP script
  try {
    const pannelRef = ref(db, `pannelneed/${username}`);
    await set(pannelRef, {
      password: password,
      access_token: token,
      expires_at: expires_at,
      // You can add any other user/service data your panel might need here
      userId: userId,
      serviceId: serviceId
    });

    return {
      success: true,
      username: username, // Pass the sanitized username to the client
      password: password,
      token: token,
      message: 'Temporary login session created.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return { success: false, message: `Failed to create login session: ${errorMessage}` };
  }
}

// Legal Content Action
const legalContentSchema = z.object({
  terms: z.string().min(1, 'Terms of Service content is required.'),
  privacy: z.string().min(1, 'Privacy Policy content is required.'),
});

export async function saveLegalContent(data: z.infer<typeof legalContentSchema>) {
    const validatedData = legalContentSchema.parse(data);
    const settingsRef = ref(db, 'settings/legal');
    await set(settingsRef, validatedData);
    revalidatePath('/admin/legal');
    revalidatePath('/terms-of-service');
    revalidatePath('/privacy-policy');
}

    