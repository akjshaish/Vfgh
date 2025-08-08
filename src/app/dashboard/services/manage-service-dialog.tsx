
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Service } from "./page";
import { CheckCircle, Globe } from "lucide-react";
import Link from "next/link";

interface ManageServiceDialogProps {
  service: Service | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ManageServiceDialog({ service, isOpen, onOpenChange }: ManageServiceDialogProps) {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage {service.name} Plan</DialogTitle>
          <DialogDescription>
            Access your control panel or manage your domain.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {service.subdomain ? (
            <div className="space-y-4">
                <div className="flex items-center p-4 rounded-md bg-secondary border border-green-500/30">
                     <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
                     <div>
                        <p className="font-semibold text-foreground">{service.subdomain}</p>
                        <p className="text-sm text-muted-foreground">This domain is linked to your service.</p>
                     </div>
                </div>
                <Button className="w-full">
                    Login to cPanel
                </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center p-4 rounded-md bg-secondary">
                 <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="font-semibold text-lg">No Domain Assigned</h3>
                <p className="text-muted-foreground text-sm">
                    You need a domain to use your hosting service.
                </p>
                <div className="flex gap-4 justify-center pt-2">
                     <Button asChild>
                        <Link href="/dashboard/subdomains">Register Free Subdomain</Link>
                    </Button>
                     <Button variant="outline" asChild>
                         <Link href="/dashboard/subdomains">Get a New Domain</Link>
                    </Button>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
