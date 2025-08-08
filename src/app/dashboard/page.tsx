
'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table"
import { AlertCircle, Box, CreditCard, LifeBuoy, FileText, Newspaper, User, PlusCircle, Power, Link as LinkIcon, Edit2, Globe, Folder, Server, Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@/app/dashboard/services/page";
import { useAuth } from "@/hooks/use-auth";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const { userId, userEmail, loading: authLoading } = useAuth();


  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    const fetchServices = async () => {
      if (!userId) {
        setLoadingServices(false);
        return;
      }
      try {
        const servicesRef = ref(db, `users/${userId}/services`);
        const snapshot = await get(servicesRef);
        if (snapshot.exists()) {
           const servicesData = snapshot.val();
           const servicesArray = Object.keys(servicesData).map(key => ({
                id: key,
                ...servicesData[key]
            }));
          setServices(servicesArray);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [userId, authLoading]);

  const stats = [
    { title: "Services", value: loadingServices ? "..." : services.length, icon: Server, href: "/dashboard/services" },
    { title: "Domains", value: "0", icon: Globe, href: "/dashboard/subdomains" },
    { title: "Unpaid Invoices", value: "0", icon: CreditCard, href: "/dashboard/billing" },
    { title: "Tickets", value: "0", icon: LifeBuoy, href: "/dashboard/support" },
  ]

  const getStatusVariant = (status: Service['status']) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Suspended': return 'secondary';
            case 'Terminated': return 'outline';
            case 'Banned': return 'destructive';
            case 'Pending': return 'secondary';
            default: return 'default';
        }
    };


  return (
    <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome to your Client Area</p>
          </div>
      </div>
      
      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, i) => (
          <motion.div key={stat.title} custom={i} variants={cardVariants}>
            <Link href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow duration-300 relative h-full">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                   <div className="text-left">
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <CardTitle className="text-4xl font-bold">{stat.value}</CardTitle>
                   </div>
                   <stat.icon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Active Products/Services</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                  <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
              ) : services.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product/Service</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {services.map(service => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>₹{service.price.toFixed(2)}/mo</TableCell>
                            <TableCell>{new Date(service.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(service.status)}>{service.status}</Badge></TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/services/${service.id}`}>
                                        <Settings className="mr-2 h-4 w-4" /> Manage
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                    <Box className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No Active Services Found</p>
                    <Button variant="link" asChild>
                        <Link href="/dashboard/order">Order New Services</Link>
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Recent Support Tickets</CardTitle>
               <Button variant="outline" size="sm" asChild>
                 <Link href="/dashboard/support">View All</Link>
               </Button>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-12">
                  <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No Recent Tickets</p>
                   <Button variant="link" asChild>
                     <Link href="/dashboard/support">Open a New Ticket</Link>
                   </Button>
                </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-accent text-accent-foreground">
            <CardHeader>
              <CardTitle>Register a Free Subdomain</CardTitle>
              <CardDescription className="text-primary-foreground/90">Check availability and register your free subdomain instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/dashboard/subdomains" className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input name="subdomain" placeholder="your-site" className="bg-background text-foreground" />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Check Availability</Button>
                </div>
                <p className="text-xs text-primary-foreground/80">
                    Want a full domain? <Link href="/dashboard/support" className="underline">Contact support</Link>.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">AquaHost User</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/account">Update</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/account">Change Password</Link>
                  </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Shortcuts</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2">
                <Link href="/dashboard/order" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <PlusCircle className="h-4 w-4" /> Order New Services
                </Link>
                 <Link href="/dashboard/subdomains" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <LinkIcon className="h-4 w-4" /> Register a New Domain
                </Link>
                 <Link href="/login" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Power className="h-4 w-4" /> Logout
                </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
