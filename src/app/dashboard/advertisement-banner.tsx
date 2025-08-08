
'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { X, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Advertisement } from '@/app/admin/advertisement/page';

interface AdSettings {
  [id: string]: Advertisement;
}

interface AdvertisementBannerProps {
    location: Advertisement['location'];
}

function SingleAd({ ad }: { ad: Advertisement }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (ad.type === 'nonClosable') {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, (ad.nonClosableAdDuration || 5) * 1000);
            return () => clearTimeout(timer);
        }
    }, [ad]);

    if (!isVisible) return null;

    const renderAdCode = (code: string) => {
        return <div dangerouslySetInnerHTML={{ __html: code }} />;
    };

    if (ad.type === 'closable') {
        return (
            <div className="relative rounded-lg border p-4 bg-card">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setIsVisible(false)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close advertisement</span>
                </Button>
                {ad.closableAdCode && renderAdCode(ad.closableAdCode)}
            </div>
        );
    }
    
    if (ad.type === 'nonClosable') {
        return (
            <Card className="bg-primary/10 border-primary/20">
                {ad.nonClosableAdMessage && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Megaphone className="h-5 w-5 text-primary" />
                            {ad.nonClosableAdMessage}
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className={!ad.nonClosableAdMessage ? "pt-6" : ""}>
                    {ad.nonClosableAdCode && renderAdCode(ad.nonClosableAdCode)}
                </CardContent>
            </Card>
        );
    }

    return null;
}

export function AdvertisementBanner({ location }: AdvertisementBannerProps) {
    const [allAds, setAllAds] = useState<Advertisement[] | null>(null);
    const [loading, setLoading] = useState(true);

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
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const relevantAds = useMemo(() => {
        if (!allAds) return [];
        return allAds.filter(ad => ad.enabled && ad.location === location);
    }, [allAds, location]);

    if (loading) {
        return (
            <div className="space-y-4 mb-6">
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (!relevantAds || relevantAds.length === 0) {
        return null;
    }
    
    return (
        <div className="space-y-6 mb-6">
            {relevantAds.map(ad => <SingleAd key={ad.id} ad={ad} />)}
        </div>
    );
}
