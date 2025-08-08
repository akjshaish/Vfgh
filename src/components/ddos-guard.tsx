
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Loader } from './loader';

interface SecuritySettings {
    ddosProtectionLevel: 'normal' | 'advanced' | 'maximum';
}

export function DdosGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    
    useEffect(() => {
        if (pathname === '/ddos-verification') {
            setLoading(false);
            return;
        }

        if (pathname === '/') {
            const isVerified = sessionStorage.getItem('ddos-verified') === 'true';

            if (isVerified) {
                setLoading(false);
                return;
            }

            const fetchSettingsAndRedirect = async () => {
                let fetchedSettings: SecuritySettings = { ddosProtectionLevel: 'normal' };
                try {
                    const settingsRef = ref(db, 'settings/security');
                    const snapshot = await get(settingsRef);
                    if (snapshot.exists()) {
                        fetchedSettings = snapshot.val();
                    }
                } catch (error) {
                    console.error("Failed to fetch DDoS settings:", error);
                }

                const protectionLevel = fetchedSettings.ddosProtectionLevel;
                const isProtected = protectionLevel === 'advanced' || protectionLevel === 'maximum';
                
                if (isProtected) {
                    router.replace(`/ddos-verification?level=${protectionLevel}`);
                } else {
                    setLoading(false);
                }
            };

            fetchSettingsAndRedirect();
        } else {
            setLoading(false);
        }
        
    }, [pathname, router]);

    if (loading) {
        return <Loader />;
    }

    return <>{children}</>;
}
