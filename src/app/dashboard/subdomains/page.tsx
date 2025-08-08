
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubdomainList } from "./subdomain-list";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function SubdomainsPage() {
  const { userId, loading } = useAuth();

  if (loading) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-12 w-1/2" />
              <Card>
                  <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                  <CardContent><Skeleton className="h-48 w-full" /></CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Manage Domains</h1>
        <p className="text-sm text-muted-foreground">
          View your registered subdomains. To register a new subdomain, please order a new service.
        </p>
      </div>

       <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Need a new subdomain?</AlertTitle>
          <AlertDescription>
            Each service plan comes with the ability to create a new subdomain. To get another one, please <a href="/dashboard/order" className="font-bold underline text-primary">order a new service</a>.
          </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Subdomains</CardTitle>
          <CardDescription>
            A list of all your registered subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubdomainList userId={userId!} />
        </CardContent>
      </Card>
    </div>
  );
}
