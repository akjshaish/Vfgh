
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { Service } from '../page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SubdomainForm } from '../../subdomains/subdomain-form';
import { ArrowLeft, Globe, LogIn, AlertTriangle, Wrench, Info, HardDrive, Unplug, RefreshCcw, Power, User, Key, Server, Settings, ExternalLink, Box, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { handleAquaPanelLogin } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


interface MaintenanceSettings {
  enabled: boolean;
  type: 'full' | 'partial';
  partialMessage?: string;
}

export default function ManageServicePage() {
    const params = useParams();
    const router = useRouter();
    const { userId } = useAuth();
    const serviceId = typeof params.serviceId === 'string' ? params.serviceId : '';
    
    const [service, setService] = useState<Service | null>(null);
    const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { toast } = useToast();

    const fetchServiceAndSettings = async () => {
        if (!serviceId || !userId) {
            if (!serviceId) setError("Service ID is missing.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const serviceRef = ref(db, `users/${userId}/services/${serviceId}`);
            const maintenanceRef = ref(db, 'settings/maintenance');

            const [serviceSnapshot, maintenanceSnapshot] = await Promise.all([
                get(serviceRef),
                get(maintenanceRef)
            ]);

            if (serviceSnapshot.exists()) {
                setService({ id: serviceSnapshot.key, ...serviceSnapshot.val() });
            } else {
                setError("Service not found or you do not have permission to access it.");
            }

            if (maintenanceSnapshot.exists()) {
                setMaintenanceSettings(maintenanceSnapshot.val());
            }

        } catch (err) {
            console.error(err);
            setError("An error occurred while fetching service details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServiceAndSettings();
    }, [serviceId, userId, router]);

    const onLoginToAquaPanel = async () => {
        if (!service?.subdomain || !service.id || !userId) {
             toast({ variant: "destructive", title: "Login Failed", description: "Service details are incomplete." });
             return;
        }
        setIsLoggingIn(true);
        try {
            const result = await handleAquaPanelLogin(userId, service.id);
            if (result.success && result.username && result.password && result.token) {
                
                // Create a form to POST data to the login script
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://inlinks.site/api/login.php';
                form.target = '_blank'; // Open in a new tab
                form.style.display = 'none'; // Hide the form

                const fields = {
                    username: result.username,
                    password: result.password,
                    access_token: result.token,
                };

                for (const key in fields) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = fields[key as keyof typeof fields]!;
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);


            } else {
                toast({ variant: "destructive", title: "Login Failed", description: result.message });
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
             toast({ variant: "destructive", title: "Error", description: message });
        } finally {
            setIsLoggingIn(false);
        }
    }


    const getStatusVariant = (status?: Service['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'Active': return 'default';
            case 'Suspended': return 'secondary';
            case 'Terminated': return 'outline';
            case 'Banned': return 'destructive';
            case 'Pending Activation': return 'secondary';
            case 'Pending': return 'secondary';
            default: return 'outline';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <Button onClick={() => router.push('/dashboard/services')} className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
    if (maintenanceSettings?.enabled && maintenanceSettings.type === 'partial') {
        return (
            <div>
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Services
                </Button>
                 <Alert variant="destructive" className="border-orange-500/50 text-orange-600 dark:text-orange-400 [&>svg]:text-orange-500">
                    <Wrench className="h-4 w-4" />
                    <AlertTitle>Partial Maintenance</AlertTitle>
                    <AlertDescription>
                        {maintenanceSettings.partialMessage || 'Service management is temporarily unavailable due to maintenance.'}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    if (!service) {
        return null;
    }


    return (
        <div className="space-y-6">
            <div>
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Services
                </Button>
                <h1 className="text-3xl font-bold font-headline">Manage Product</h1>
                 <p className="text-sm text-muted-foreground">
                    Manage your {service.name} plan and view details.
                </p>
            </div>

            <div className="lg:col-span-1 bg-primary text-primary-foreground rounded-lg p-6 flex flex-col justify-between shadow-lg min-h-[240px]">
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Box className="h-16 w-16 opacity-75 mb-4" />
                    <h2 className="text-2xl font-bold">Shared Hosting - {service.name}</h2>
                    <div className="mt-2">
                         <Badge variant={getStatusVariant(service.status)} className="bg-white/20 text-white font-medium py-1 px-3">
                            Status: {service.status}
                        </Badge>
                    </div>
                </div>
                <div className="mt-4 text-center font-mono text-lg text-primary-foreground/90 flex items-center justify-center gap-2">
                    <span>{service.subdomain || "No domain assigned"}</span>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 items-center">
                    <div className="flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground text-lg mb-4">Disk Usage</p>
                        <div 
                            className="relative h-32 w-32"
                        >
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path
                                    className="stroke-current text-gray-200 dark:text-gray-700"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                ></path>
                                <path
                                    className="stroke-current text-primary"
                                    strokeDasharray="0, 100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                ></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">0</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">0 M / {service.storage || 'Unlimited'} M</p>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground text-lg mb-4">Bandwidth Usage</p>
                         <div 
                            className="relative h-32 w-32"
                        >
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path
                                    className="stroke-current text-gray-200 dark:text-gray-700"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                ></path>
                                 <path
                                    className="stroke-current text-primary"
                                    strokeDasharray="0, 100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                ></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">0</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">0 M / Unlimited M</p>
                    </div>
                </CardContent>
            </Card>
            
            {!service.subdomain && (
                <Card>
                    <CardHeader>
                        <CardTitle>Assign a Subdomain</CardTitle>
                        <CardDescription>
                            Your hosting plan needs a subdomain. Register a free one below to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SubdomainForm serviceId={service.id} />
                    </CardContent>
                </Card>
            )}

             <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Manage your product from here.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {service.status === 'Active' && service.subdomain ? (
                            <Button onClick={onLoginToAquaPanel} disabled={isLoggingIn} variant="default" className="justify-start gap-3 h-12">
                                {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin"/> : <LogIn className="h-5 w-5"/>}
                                <span className="text-base">{isLoggingIn ? 'Redirecting...' : 'Login to AquaPanel'}</span>
                            </Button>
                        ) : (
                             <Button variant="secondary" className="justify-start gap-3 h-12" disabled>
                                <LogIn className="h-5 w-5"/>
                                <span className="text-base">Login to AquaPanel</span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
