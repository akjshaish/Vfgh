
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketForm } from "./ticket-form";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">
            Create and manage your support tickets here.
            </p>
        </div>
        <Button asChild>
            <Link href="/dashboard/support/tickets">
                <List className="mr-2 h-4 w-4" />
                View My Tickets
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open a New Ticket</CardTitle>
          <CardDescription>
            Fill out the form below and our AI will prioritize your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
