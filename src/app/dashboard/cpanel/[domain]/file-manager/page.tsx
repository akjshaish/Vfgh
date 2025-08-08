
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, ArrowLeft } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function FileManagerPage() {
    const params = useParams();
    const router = useRouter();
    const domain = typeof params.domain === 'string' ? decodeURIComponent(params.domain) : '';

    return (
        <div className="space-y-8">
            <div>
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to cPanel
                </Button>
                <h1 className="text-3xl font-bold font-headline">File Manager: {domain}</h1>
                <p className="text-sm text-muted-foreground">
                    This feature is under construction. Soon you will be able to manage your files here.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Folder className="w-6 h-6" />
                        File Management - Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The ability to list, upload, and manage your files directly through this interface is coming soon. Stay tuned!</p>
                </CardContent>
            </Card>
        </div>
    );
}
