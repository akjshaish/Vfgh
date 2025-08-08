
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File } from "lucide-react";

export default function FileManagerPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">File Manager</h1>
                <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <File className="w-6 h-6" />
                        File Manager - Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The ability to manage your files directly through this interface is coming soon. Stay tuned!</p>
                </CardContent>
            </Card>
        </div>
    );
}
