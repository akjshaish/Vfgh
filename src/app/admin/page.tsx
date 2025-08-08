
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LifeBuoy, Package, DollarSign, UserCheck, HardDrive } from 'lucide-react';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get, query, limitToLast, orderByChild } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface Stat {
    title: string;
    value: string;
    icon: React.ElementType;
    loading: boolean;
}

interface User {
    id: string;
    email: string;
    createdAt: string;
    services?: { [key: string]: { price: number; storage?: number } };
}

interface SystemHealth {
    totalUsers: number;
    paidUsers: number;
    freeUsers: number;
    totalStorageUsed: number; // in MB
}

const COLORS = ['#0088FE', '#00C49F']; // Blue for Paid, Green for Free

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stat[]>([
        { title: "Total Users", value: "0", icon: Users, loading: true },
        { title: "Open Tickets", value: "0", icon: LifeBuoy, loading: true },
        { title: "Active Plans", value: "0", icon: Package, loading: true },
        { title: "Monthly Revenue", value: "₹0", icon: DollarSign, loading: true },
    ]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [usersSnap, ticketsSnap, plansSnap] = await Promise.all([
                    get(ref(db, 'users')),
                    get(ref(db, 'tickets')),
                    get(ref(db, 'plans'))
                ]);

                // --- Calculate Core Stats ---
                const userCount = usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0;
                const ticketCount = ticketsSnap.exists() ? Object.keys(ticketsSnap.val()).length : 0;
                const planCount = plansSnap.exists() ? Object.keys(plansSnap.val()).length : 0;
                
                let monthlyRevenue = 0;
                let paidUsers = 0;
                const freeUserSet = new Set<string>();
                let totalStorageUsed = 0;
                const usersData = usersSnap.val() || {};

                for (const userId in usersData) {
                    const user = usersData[userId];
                    let isPaid = false;
                    if (user.services) {
                        for (const serviceId in user.services) {
                            const service = user.services[serviceId];
                            if (service.price && typeof service.price === 'number') {
                                monthlyRevenue += service.price;
                                if (service.price > 0) isPaid = true;
                            }
                             // Defaulting to 100MB if not specified, as per free plan
                            totalStorageUsed += service.storage || 100;
                        }
                    }
                     if (isPaid) {
                        paidUsers++;
                    } else {
                        freeUserSet.add(userId);
                    }
                }
                const freeUsers = freeUserSet.size;

                setStats([
                    { title: "Total Users", value: userCount.toString(), icon: Users, loading: false },
                    { title: "Open Tickets", value: ticketCount.toString(), icon: LifeBuoy, loading: false },
                    { title: "Active Plans", value: planCount.toString(), icon: Package, loading: false },
                    { title: "Monthly Revenue", value: `₹${monthlyRevenue.toFixed(2)}`, icon: DollarSign, loading: false },
                ]);

                setSystemHealth({
                    totalUsers: userCount,
                    paidUsers,
                    freeUsers,
                    totalStorageUsed,
                });
                
                // --- Fetch Recent Users ---
                const recentUsersQuery = query(ref(db, 'users'), orderByChild('createdAt'), limitToLast(5));
                const recentUsersSnap = await get(recentUsersQuery);
                if (recentUsersSnap.exists()) {
                    const recentUsersData = recentUsersSnap.val();
                    const usersArray = Object.keys(recentUsersData).map(key => ({
                        id: key,
                        ...recentUsersData[key]
                    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setRecentUsers(usersArray);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
                setStats(prevStats => prevStats.map(stat => ({ ...stat, value: "Error", loading: false })));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const healthChartData = systemHealth ? [
        { name: 'Paid Users', value: systemHealth.paidUsers },
        { name: 'Free Users', value: systemHealth.freeUsers },
    ] : [];

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
                Welcome back, Admin. Here's an overview of your platform.
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stat.loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <div className="text-2xl font-bold">{stat.value}</div>
                    )}
                </CardContent>
            </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Recent Signups</CardTitle>
                    <CardDescription>The last 5 users to register on your platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : recentUsers.length > 0 ? (
                         <div className="space-y-4">
                            {recentUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{user.email ? user.email.substring(0, 2).toUpperCase() : 'N/A'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.email || 'No email'}</p>
                                            <p className="text-xs text-muted-foreground">Joined on {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant={user.services && Object.values(user.services).some(s => s.price > 0) ? 'default' : 'secondary'}>
                                        {user.services && Object.values(user.services).some(s => s.price > 0) ? 'Paid' : 'Free'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-12">
                            <Users className="h-12 w-12 mx-auto mb-2" />
                            <p>No user signups yet.</p>
                       </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>An overview of your platform's usage.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : systemHealth ? (
                        <div className="space-y-6">
                            <div className="h-48 w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={healthChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                                            {healthChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-[#0088FE]"></span>
                                        <span>Paid Users</span>
                                    </div>
                                    <span className="font-medium">{systemHealth.paidUsers}</span>
                                </div>
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-[#00C49F]"></span>
                                        <span>Free Users</span>
                                    </div>
                                    <span className="font-medium">{systemHealth.freeUsers}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                     <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        <span>Total Storage Used</span>
                                    </div>
                                    <span className="font-medium">{(systemHealth.totalStorageUsed / 1024).toFixed(2)} GB</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Could not load system health data.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
