
'use client';

import Link from "next/link";
import {
  Bell,
  Menu,
  Home,
  FileText,
  Globe,
  CreditCard,
  LifeBuoy,
  LogOut,
  User,
  Server,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Loader } from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { AdvertisementBanner } from "./advertisement-banner";
import { ThemeToggle } from "@/components/theme-toggle";

interface MaintenanceSettings {
  enabled: boolean;
  type: 'full' | 'partial';
  fullMessage?: string;
  partialMessage?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { userId, userEmail, loading: authLoading } = useAuth();
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated after auth check
    if (!authLoading && !userId) {
      router.push('/login');
    }
  }, [userId, authLoading, router]);


  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/maintenance');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          setMaintenanceSettings(snapshot.val());
        }
      } catch (error) {
        console.error("Failed to fetch maintenance settings", error);
        // Proceed without maintenance mode if settings can't be fetched
        setMaintenanceSettings({ enabled: false, type: 'full' });
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenanceSettings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };
  
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/services", icon: Server, label: "Services", disabled: maintenanceSettings?.enabled && maintenanceSettings.type === 'partial' },
    { href: "/dashboard/order", icon: ShoppingCart, label: "Order New Services" },
    { href: "/dashboard/subdomains", icon: Globe, label: "Subdomains" },
    { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
    { href: "/dashboard/support", icon: LifeBuoy, label: "Support" },
  ];

  if (loading || authLoading || !userId) {
    return <Loader />;
  }

  if (maintenanceSettings?.enabled && maintenanceSettings.type === 'full') {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg text-center border-orange-500/50">
                <CardHeader>
                    <div className="mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full p-3 w-fit">
                        <Wrench className="h-10 w-10 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Under Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                        {maintenanceSettings.fullMessage || 'The platform is currently undergoing maintenance. We will be back shortly.'}
                    </p>
                    <Button onClick={handleLogout} className="mt-6">Logout</Button>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                 <Link
                  key={item.label}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )}
                  aria-disabled={item.disabled}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
           <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo />
                  </Link>
               </div>
              <nav className="grid gap-2 text-lg font-medium p-4">
                 {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.disabled ? '#' : item.href}
                    className={cn(
                        "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                        item.disabled && "cursor-not-allowed opacity-50"
                    )}
                    aria-disabled={item.disabled}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
               <div className="mt-auto p-4">
                <Button size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userEmail === 'admin@razorhost.xyz' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link href="/dashboard/account">Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/support">Support</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> 
                  Logout
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <AdvertisementBanner location="dashboard" />
          {children}
        </main>
      </div>
    </div>
  );
}
