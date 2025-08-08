
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function DatabasesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Databases</h1>
                <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-6 h-6" />
                        Database Management - Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The ability to create and manage your databases will be available here soon.</p>
                </CardContent>
            </Card>
        </div>
    );
}
