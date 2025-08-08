
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function EmailPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Email Accounts</h1>
                <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-6 h-6" />
                        Email Accounts - Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The functionality to manage your email accounts is currently being developed and will be available shortly.</p>
                </CardContent>
            </Card>
        </div>
    );
}
