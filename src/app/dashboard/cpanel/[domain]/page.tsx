
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Folder, 
    Database, 
    Mail, 
    Shield, 
    BarChart2, 
    FileCode, 
    Terminal, 
    Timer, 
    Globe, 
    Lock,
    Cpu,
    Server,
    HardDrive,
    Unplug,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const cpanelFeatures = [
    { title: "File Manager", icon: Folder, description: "Manage your website files.", category: 'Files', href: (domain: string) => `/dashboard/cpanel/${domain}/file-manager` },
    { title: "Databases", icon: Database, description: "Create and manage databases.", category: 'Databases', href: () => '#' },
    { title: "Email Accounts", icon: Mail, description: "Set up and manage email.", category: 'Email', href: () => '#' },
    { title: "PHP Selector", icon: FileCode, description: "Change your PHP version.", category: 'Software', href: () => '#' },
    { title: "Cron Jobs", icon: Timer, description: "Automate scheduled tasks.", category: 'Advanced', href: () => '#' },
    { title: "SSL/TLS Status", icon: Shield, description: "Manage SSL certificates.", category: 'Security', href: () => '#' },
    { title: "Directory Privacy", icon: Lock, description: "Password protect directories.", category: 'Security', href: () => '#' },
    { title: "Visitor Stats", icon: BarChart2, description: "View website traffic.", category: 'Metrics', href: () => '#' },
    { title: "Terminal", icon: Terminal, description: "Access the command line.", category: 'Advanced', href: () => '#' },
];

interface Service {
    name: string;
    price: number;
    features: string[];
    websites: number;
    storage?: number; // Add storage if available in plan
    bandwidth?: number; // Add bandwidth if available in plan
}

export default function CpanelPage() {
    const params = useParams();
    const router = useRouter();
    const { userId } = useAuth();
    const domain = typeof params.domain === 'string' ? decodeURIComponent(params.domain) : '';

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!domain || !userId) return;

        const verifyOwnershipAndFetchService = async () => {
            try {
                // 1. Verify subdomain ownership by querying for the specific domain and checking the userId.
                const subdomainsQuery = query(ref(db, 'subdomains'), orderByChild('subdomain'), equalTo(domain));
                const snapshot = await get(subdomainsQuery);

                if (!snapshot.exists()) {
                    router.push(`/dashboard/cpanel/access-denied?domain=${domain}`);
                    return;
                }

                const subdomainsData = snapshot.val();
                const subdomainKey = Object.keys(subdomainsData)[0];
                const foundSubdomain = subdomainsData[subdomainKey];

                if (foundSubdomain.userId !== userId) {
                    router.push(`/dashboard/cpanel/access-denied?domain=${domain}`);
                    return;
                }

                // 2. Fetch the associated service from the user's record.
                const userServicesRef = ref(db, `users/${userId}/services`);
                const servicesSnapshot = await get(userServicesRef);
                if (servicesSnapshot.exists()) {
                    const services = servicesSnapshot.val();
                    const associatedService = Object.values(services).find((s: any) => s.subdomain === domain) as Service;
                    if (associatedService) {
                        setService(associatedService);
                    } else {
                        setError("Could not find a service linked to this domain for your account.");
                    }
                } else {
                    setError("No services found for your account.");
                }

            } catch (err) {
                console.error(err);
                setError("An error occurred while verifying domain ownership.");
            } finally {
                setLoading(false);
            }
        };
        
        verifyOwnershipAndFetchService();

    }, [domain, userId, router]);
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle /> Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                     <Button onClick={() => router.push('/dashboard')} className="mt-4">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!service) {
        return null; // Should be handled by redirects or error state
    }

    const stats = [
        // Using placeholder for usage, but limit from service plan
        { title: "Disk Usage", value: `150.5 / ${service.storage || 1024} MB`, icon: HardDrive },
        { title: "Bandwidth", value: `3.2 / ${service.bandwidth || 100} GB`, icon: Unplug },
        { title: "CPU Usage", value: "5%", icon: Cpu },
        { title: "Active Plan", value: service.name, icon: Server },
    ];

    const categories = Array.from(new Set(cpanelFeatures.map(f => f.category)));

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Globe className="w-8 h-8 text-primary" />
                    {domain}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your control panel dashboard.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Your account usage at a glance.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map(stat => (
                         <div key={stat.title} className="p-4 bg-secondary rounded-lg flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <stat.icon className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">{stat.title}</p>
                                    <p className="font-bold text-base">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>


            {categories.map(category => (
                 <Card key={category}>
                    <CardHeader>
                        <CardTitle>{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {cpanelFeatures.filter(f => f.category === category).map(feature => (
                            <Link href={feature.href(domain)} key={feature.title}>
                                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary hover:bg-primary/10 hover:shadow-md transition-all text-center h-full">
                                    <feature.icon className="h-10 w-10 mb-2 text-primary" />
                                    <p className="font-semibold text-sm">{feature.title}</p>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
