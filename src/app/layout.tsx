
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PageTransitionLoader } from '@/components/page-transition-loader';
import { DdosGuard } from '@/components/ddos-guard';
import { FloatingAd } from '@/components/floating-ad';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'AquaHost',
  description: 'Your reliable hosting partner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-body antialiased">
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <DdosGuard>
            <PageTransitionLoader>
              <FloatingAd />
              {children}
            </PageTransitionLoader>
            <Toaster />
          </DdosGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
