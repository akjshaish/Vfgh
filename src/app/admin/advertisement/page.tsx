
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle, Trash, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AdvertisementForm } from './advertisement-form';

export interface Advertisement {
  id: string;
  name: string;
  enabled: boolean;
  location: 'home' | 'dashboard' | 'order' | 'forgot_password';
  type: 'closable' | 'nonClosable' | 'floating';
  closableAdCode?: string;
  nonClosableAdMessage?: string;
  nonClosableAdCode?: string;
  nonClosableAdDuration?: number;
  floatingAdMessage?: string;
}

export default function AdminAdvertisementPage() {
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchAds = async () => {
      setLoading(true);
      try {
        const settingsRef = ref(db, 'settings/advertisements');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const adsData = snapshot.val();
          const adsArray = Object.keys(adsData).map(key => ({
            id: key,
            ...adsData[key]
          }));
          setAds(adsArray);
        } else {
            setAds([]);
        }
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch advertisements.",
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAds();
  }, [toast]);

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    fetchAds();
  };

  const openNewDialog = () => {
    setEditingAd(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (ad: Advertisement) => {
    setEditingAd(ad);
    setIsDialogOpen(true);
  };
  
  const handleDeleteAd = async (adId: string) => {
    setIsDeleting(true);
    try {
        await remove(ref(db, `settings/advertisements/${adId}`));
        toast({
            title: "Success",
            description: "Advertisement deleted successfully."
        });
        fetchAds();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete advertisement."
        });
    } finally {
        setIsDeleting(false);
    }
  }

  const getTypeLabel = (type: Advertisement['type']) => {
    switch (type) {
      case 'closable': return 'Closable';
      case 'nonClosable': return 'Auto-Hide';
      case 'floating': return 'Floating Box';
      default: return 'Unknown';
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Advertisement Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage targeted sitewide advertisements.
            </p>
        </div>
        <Button onClick={openNewDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Ad
        </Button>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}</DialogTitle>
                    <DialogDescription>
                        Configure the details and content for your ad.
                    </DialogDescription>
                </DialogHeader>
                <AdvertisementForm ad={editingAd} onSuccess={handleFormSuccess} />
            </DialogContent>
        </Dialog>

      <Card>
          <CardHeader>
              <CardTitle>Your Advertisements</CardTitle>
              <CardDescription>A list of all configured ads.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                          ))
                      ) : ads.length > 0 ? (
                          ads.map(ad => (
                            <TableRow key={ad.id}>
                                <TableCell className="font-medium">{ad.name}</TableCell>
                                <TableCell><Badge variant="outline">{ad.location}</Badge></TableCell>
                                <TableCell><Badge variant="secondary">{getTypeLabel(ad.type)}</Badge></TableCell>
                                <TableCell>
                                    <Badge variant={ad.enabled ? 'default' : 'destructive'}>
                                        {ad.enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(ad)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the ad "{ad.name}".</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteAd(ad.id)} disabled={isDeleting}>
                                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">No advertisements found. Create one to get started.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
