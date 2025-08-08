
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Basic markdown to HTML renderer
const renderMarkdown = (text: string) => {
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/g, '<br />');
};

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const contentRef = ref(db, 'settings/legal/privacy');
        const snapshot = await get(contentRef);
        if (snapshot.exists()) {
          setContent(snapshot.val());
        } else {
          setContent('Privacy Policy content has not been set by the administrator.');
        }
      } catch (error) {
        console.error("Failed to fetch policy:", error);
        setContent('Could not load the Privacy Policy. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="bg-background min-h-screen">
       <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <Logo />
        <nav className="ml-auto">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </nav>
      </header>
      <main className="container mx-auto px-4 md:px-6 py-12">
        <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto bg-card p-8 rounded-lg shadow">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-8 w-1/2 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          )}
        </article>
      </main>
    </div>
  );
}
