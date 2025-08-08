
'use server';

import nodemailer from 'nodemailer';
import { db } from './firebase';
import { ref, get } from 'firebase/database';
import { getEmailHtml } from './email-template';

interface SmtpConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
}

interface EmailPayload {
    to: string;
    subject: string;
    type: 'login' | 'verification' | 'password-reset-otp';
    payload: {
        code?: string;
        link?: string;
    };
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
    try {
        const settingsRef = ref(db, 'settings/smtp');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch SMTP settings:", error);
        return null;
    }
}


export async function sendEmail(payload: EmailPayload) {
    const config = await getSmtpConfig();

    if (!config || !config.smtpUser) {
        throw new Error("SMTP settings are not configured in the admin panel, or the SMTP username is missing.");
    }
    
    const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass || '',
        },
    });

    const { html, text } = getEmailHtml(payload.type, payload.payload);

    try {
        await transporter.sendMail({
            from: `"${process.env.APP_NAME || 'AquaHost'}" <${config.smtpUser}>`, // Use smtpUser as from address
            to: payload.to,
            subject: payload.subject,
            text: text,
            html: html,
        });
        console.log('Email sent successfully to', payload.to);
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email. Please check SMTP configuration and credentials.');
    }
}
