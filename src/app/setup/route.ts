
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function GET() {
  try {
    // 1. Define Plans with the correct structure
    const plans = {
      'plan-free': {
        name: 'Free',
        price: 0,
        features: ['1 Subdomain', '100 MB Storage', '1 Database'],
        websites: 1, // Correct field for website/subdomain limit
      },
      'plan-basic': {
        name: 'Basic',
        price: 5,
        features: ['5 Subdomains', '1 GB Storage', '5 Databases', 'Email Support'],
        websites: 5,
      },
      'plan-premium': {
        name: 'Premium',
        price: 15,
        features: [
          'Unlimited Subdomains',
          '10 GB Storage',
          'Unlimited Databases',
          'Priority Support',
        ],
        websites: -1, // -1 for unlimited
      },
    };

    // 2. Define Admin User
    const adminEmail = 'admin@razorhost.xyz';
    const adminPassword = 'password123';

    // 3. Define default settings
    const settings = {
        domain: {
            domain: 'aquahost.app'
        },
        dns: {
            autoDnsEnabled: false,
            testModeEnabled: true,
        },
        gateways: {
            fakeGateway: {
                enabled: true,
                qrCodeUrl: 'https://placehold.co/200x200.png'
            },
            razorpay: {
                enabled: false,
            }
        },
        smtp: {
            requireVerification: true,
        },
    };

    // 4. Write all data to Realtime Database
    await set(ref(db, 'plans'), plans);
    await set(ref(db, 'admins/admin_user_main'), {
        email: adminEmail,
        password: adminPassword, // Note: Storing passwords in plain text is not secure for production.
        role: 'superadmin'
    });
    await set(ref(db, 'settings'), settings);
    

    // Clear existing user data for a fresh start
    await set(ref(db, 'users'), null);
    await set(ref(db, 'subdomains'), null);
    await set(ref(db, 'tickets'), null);


    return NextResponse.json({
      message: 'Setup complete! Database has been re-initialized.',
      admin_email: adminEmail,
      admin_password: adminPassword,
      warning: "This is for development only. It wipes existing user data and uses an insecure method for the admin password."
    });

  } catch (error) {
    console.error('Setup failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ message: 'Setup failed!', error: errorMessage }), { status: 500 });
  }
}
