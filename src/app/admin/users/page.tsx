
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, UserX, UserCheck, Eye, Search } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { updateUserStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface User {
    id: string;
    name?: string;
    email: string;
    plan?: string;
    status?: 'Active' | 'Suspended' | 'Banned' | 'Terminated';
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const usersArray = Object.keys(usersData).map(key => ({
                    id: key,
                    ...usersData[key]
                }));
                setUsers(usersArray);
                setFilteredUsers(usersArray);
            } else {
                setUsers([]);
                setFilteredUsers([]);
            }
        } catch (err) {
            setError('Failed to fetch users. Please check your database connection and rules.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const results = users.filter(user =>
            user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(results);
    }, [searchTerm, users]);

    const handleUpdateStatus = async (userId: string, status: 'Active' | 'Suspended') => {
        setUpdatingUserId(userId);
        try {
            await updateUserStatus(userId, status);
            toast({
                title: "Success",
                description: `User has been ${status === 'Active' ? 'activated' : 'suspended'}.`,
            });
            // Update the local state to reflect the change immediately
            const newUsers = users.map(user => user.id === userId ? { ...user, status } : user)
            setUsers(newUsers);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update user status.",
            });
        } finally {
            setUpdatingUserId(null);
        }
    }

    const handleRowClick = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <p className="text-sm text-muted-foreground">
                    View, manage, and suspend user accounts.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users registered on your platform.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                     {error && <p className="text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                     <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow 
                                        key={user.id} 
                                        onClick={() => handleRowClick(user.id)}
                                        className="cursor-pointer"
                                    >
                                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.plan || 'Free'}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                                                {user.status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {updatingUserId === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                         <DropdownMenuItem onClick={() => handleRowClick(user.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Manage User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                         {user.status !== 'Suspended' ? (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'Suspended')}>
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Suspend
                                                            </DropdownMenuItem>
                                                         ) : (
                                                             <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'Active')}>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </DropdownMenuItem>
                                                         )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
