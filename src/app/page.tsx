
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Server, Globe, Settings, Lock, Mail, ArrowRight, Check, ShoppingCart, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { WordPressIcon } from '@/components/wordpress-icon';
import { AdvertisementBanner } from './dashboard/advertisement-banner';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Plan } from '@/app/admin/plans/page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const features = [
  { icon: Server, title: 'cPanel Control Panel', description: 'Full control over your hosting with an intuitive cPanel.' },
  { icon: Globe, title: 'Free Subdomains', description: 'Get a free subdomain and start your website in seconds.' },
  { icon: WordPressIcon, title: 'WordPress Installer', description: 'Install WordPress with a single click and get online fast.' },
  { icon: Settings, title: 'PHP Version Selector', description: 'Choose the PHP version that best suits your project needs.' },
  { icon: Lock, title: 'Directory Protection', description: 'Secure your folders with password protection.' },
  { icon: Mail, title: 'Cron Job Manager', description: 'Automate your tasks with our easy-to-use cron job manager.' },
];

interface HomepageSettings {
  message: string;
  featuredPlanIds: string[];
}

export default function HomePage() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsSnap, plansSnap] = await Promise.all([
          get(ref(db, 'settings/homepage')),
          get(ref(db, 'plans')),
        ]);

        if (settingsSnap.exists()) {
          setSettings(settingsSnap.val());
        }

        if (plansSnap.exists()) {
          const plansData = plansSnap.val();
          const plansArray = Object.keys(plansData).map(key => ({
            id: key,
            ...plansData[key],
          }));
          setPlans(plansArray);
        }
      } catch (error) {
        console.error("Failed to fetch homepage data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOrderClick = (plan: Plan) => {
    if (userId) {
        setSelectedPlan(plan);
        setIsPlanDialogOpen(true);
    } else {
        setIsNavigating(true);
        router.push('/login');
    }
  };

  const proceedToOrder = () => {
    if (!selectedPlan?.id) return;
    setIsNavigating(true);
    router.push(`/dashboard/order/${selectedPlan.id}`);
  }

  const featuredPlans = settings?.featuredPlanIds
    ? plans.filter(p => p.id && settings.featuredPlanIds.includes(p.id))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <Logo />
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
            Features
          </Link>
          <Link href="/dashboard/order" className="text-sm font-medium hover:underline underline-offset-4">
            Pricing
          </Link>
          <Link href="/dashboard/support" className="text-sm font-medium hover:underline underline-offset-4">
            Support
          </Link>
          {!authLoading && (
            userId ? (
                 <Button asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </Button>
            ) : (
                <>
                    <Button variant="outline" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Register</Link>
                    </Button>
                </>
            )
          )}
        </nav>
         <div className="ml-auto md:hidden">
            <Button asChild>
                <Link href={userId ? "/dashboard" : "/login"}>
                    {userId ? "Dashboard" : "Get Started"}
                </Link>
            </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 md:px-6">
          <AdvertisementBanner location="home" />
        </div>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full py-12 md:py-24 lg:py-32"
        >
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col gap-4 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-primary"
                >
                    {loading ? <Skeleton className="h-4 w-48" /> : (settings?.message || 'Free hosting + Sub domain')}
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-foreground"
                >
                Powerful Web Hosting, Made Simple.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-[600px] text-muted-foreground md:text-xl"
                >
                Get free subdomain hosting with a complete cPanel-like experience. Perfect for developers, students, and startups.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                <Button asChild size="lg">
                    <Link href="/register">Get Started for Free <ArrowRight className="ml-2"/></Link>
                </Button>
                </motion.div>
            </div>
          </div>
        </motion.section>
        
        {loading ? (
            <section className="w-full py-12 md:py-24">
                <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </section>
        ) : featuredPlans.length > 0 && (
            <section className="w-full py-12 md:py-24 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredPlans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow">
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <CardDescription className="text-4xl font-bold text-primary">
                                            {plan.price > 0 ? `₹${plan.price}` : 'Free'}
                                            <span className="text-sm font-normal text-muted-foreground">{plan.price > 0 ? '/mo' : ''}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-3 text-sm">
                                            {Array.isArray(plan.features) && plan.features.map(feature => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <Check className="h-5 w-5 text-green-500" />
                                                    <span className="text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" size="lg" onClick={() => handleOrderClick(plan)} disabled={isNavigating}>
                                            <ShoppingCart />
                                            <span className="ml-2">Order Now</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        )}


        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl mb-12 text-foreground">
              All The Features You Need
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <CardContent className="p-6 flex flex-col items-center text-center flex-1">
                      <feature.icon className="h-12 w-12 mb-4 text-primary" />
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground flex-1">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6 text-center">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                    Ready to launch your website?
                </h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed my-6">
                    Join thousands of satisfied users who trust our platform for their hosting needs.
                </p>
                 <Button asChild size="lg">
                    <Link href="/register">Sign Up Now <ArrowRight className="ml-2"/></Link>
                 </Button>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card">
        <p className="text-xs text-muted-foreground">&copy; 2024 AquaHost. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms-of-service" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="text-xs hover:underline underline-offset-4">
            Privacy Policy
          </Link>
        </nav>
      </footer>
      
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                {selectedPlan && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedPlan.name}</DialogTitle>
                            <DialogDescription className="text-3xl font-bold text-primary pt-2">
                                {selectedPlan.price > 0 ? `₹${selectedPlan.price}/mo` : 'Free'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <ul className="space-y-3 text-sm">
                                {Array.isArray(selectedPlan.features) && selectedPlan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <DialogFooter>
                            <Button onClick={proceedToOrder} className="w-full" size="lg" disabled={isNavigating}>
                                {isNavigating ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                                <span className="ml-2">Proceed to Order</span>
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>

    </div>
  );
}
