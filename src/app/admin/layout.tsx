'use client';

import Link from "next/link";
import {
  Bell,
  Menu,
  Home,
  Users,
  LifeBuoy,
  Package,
  LogOut,
  User,
  ShoppingCart,
  Loader2,
  Wallet,
  Globe,
  Wrench,
  ShieldCheck,
  Users2,
  Shield,
  Mail,
  Megaphone,
  LayoutDashboard,
  Cloud,
  CreditCard,
  Banknote,
  FileText,
  Gavel,
  Ban,
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
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/admin", icon: Home, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/invoices", icon: FileText, label: "Invoices" },
  { href: "/admin/tickets", icon: LifeBuoy, label: "Tickets" },
  { href: "/admin/services", icon: Package, label: "Services" },
  { href: "/admin/domain-settings", icon: Globe, label: "Domain Settings" },
  { href: "/admin/dns", icon: Cloud, label: "cPanel API" },
  { href: "/admin/email-settings", icon: Mail, label: "Email Settings" },
  { href: "/admin/payment-gateways/stripe", icon: CreditCard, label: "Stripe Gateway" },
  { href: "/admin/payment-gateways/upi", icon: Banknote, label: "UPI Gateway" },
  { href: "/admin/invoice-settings", icon: Wallet, label: "Invoice Settings" },
  { href: "/admin/advertisement", icon: Megaphone, label: "Advertisement" },
  { href: "/admin/homepage-settings", icon: LayoutDashboard, label: "Homepage Settings" },
  { href: "/admin/legal", icon: Gavel, label: "Legal Content" },
  { href: "/admin/restrictions", icon: Ban, label: "Restrictions" },
  { href: "/admin/maintenance", icon: Wrench, label: "Maintenance" },
  { href: "/admin/security", icon: Shield, label: "Security" },
  { href: "/admin/logs", icon: ShieldCheck, label: "Auth Logs" },
  { href: "/admin/multi-login", icon: Users2, label: "Multi-Login" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Simulate API call
    setTimeout(() => {
        router.push('/login');
    }, 500);
  };

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Logo />
              <span className="font-bold">Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button size="sm" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
            <SheetContent side="left" className="flex flex-col p-0 overflow-y-auto">
               <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 sticky top-0 bg-card">
                 <Link href="/admin" className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
                    <Logo />
                     <span className="font-bold">Admin</span>
                  </Link>
               </div>
              <nav className="grid gap-2 text-lg font-medium p-4 flex-1">
                 {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    onClick={handleLinkClick}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
               <div className="mt-auto p-4 sticky bottom-0 bg-card">
                <Button size="sm" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
                   {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                   {isLoggingOut ? 'Logging out...' : 'Logout'}
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
                <DropdownMenuItem asChild><Link href="#">Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Logout
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
