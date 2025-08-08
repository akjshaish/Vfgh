
'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { X, Megaphone } from 'lucide-react';
import type { Advertisement } from '@/app/admin/advertisement/page';
import { AnimatePresence, motion } from 'framer-motion';

interface AdSettings {
  [id: string]: Advertisement;
}

export function FloatingAd() {
    const [allAds, setAllAds] = useState<Advertisement[] | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsRef = ref(db, 'settings/advertisements');
                const snapshot = await get(settingsRef);
                if (snapshot.exists()) {
                    const adsData = snapshot.val() as AdSettings;
                    const adsArray = Object.keys(adsData).map(key => ({ id: key, ...adsData[key] }));
                    setAllAds(adsArray);
                } else {
                    setAllAds([]);
                }
            } catch (error) {
                console.error("Failed to fetch ad settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const getLocationFromPath = (path: string): Advertisement['location'] | 'unknown' => {
        if (path === '/') return 'home';
        if (path.startsWith('/dashboard')) return 'dashboard';
        if (path.startsWith('/order')) return 'order';
        if (path.startsWith('/forgot-password')) return 'forgot_password';
        return 'unknown';
    };

    const floatingAd = useMemo(() => {
        if (!allAds) return null;
        const currentLocation = getLocationFromPath(pathname);
        return allAds.find(ad => ad.enabled && ad.type === 'floating' && ad.location === currentLocation);
    }, [allAds, pathname]);
    
    useEffect(() => {
        if (floatingAd) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [floatingAd, pathname]); // Depend on pathname to re-trigger on navigation

    return (
         <AnimatePresence>
            {isVisible && floatingAd && (
                 <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="fixed top-5 right-5 z-[100] w-auto max-w-sm"
                >
                    <div className="rounded-lg border bg-card text-card-foreground shadow-lg p-4 flex items-start gap-4">
                        <div className="text-primary pt-1">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-sm">
                            {floatingAd.floatingAdMessage}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close announcement</span>
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
