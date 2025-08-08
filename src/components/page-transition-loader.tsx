
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader } from './loader';

export function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This is a simplified approach. In a real app, you might use Next.js's router events.
    // However, for this component, we'll use a timeout to simulate the loading process
    // whenever the pathname changes.

    const handleStart = () => setLoading(true);
    const handleComplete = () => {
       // A small delay to make the transition feel smoother
       setTimeout(() => setLoading(false), 300);
    };

    // We can't directly use router.events here as it's not a hook.
    // Instead, we watch for pathname changes.
    // When a change starts, we don't have a direct event,
    // but when it completes, the `pathname` variable updates.
    // So we'll use a workaround.
    setLoading(true);
    handleComplete();


  }, [pathname]);


   useEffect(() => {
    // A fallback to ensure the loader is hidden if something goes wrong
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Hide loader after 3 seconds regardless

    return () => clearTimeout(timer);
  }, [loading]);

  // A more robust way to do this in Next.js 13+ App Router without router.events
  // is to use a combination of hooks and a little bit of a trick with `useEffect`.
  // The logic above simulates this.
  
  // This effect will run on the initial load and when the pathname changes.
  useEffect(() => {
    setLoading(false); // Hide loader once the new page component has mounted
  }, [pathname]);
  
  // A simple link click handler would look like this:
  // (This logic would be on your <Link> components, but we'll manage it globally here)
   useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;
      if (targetUrl !== currentUrl) {
         setLoading(true);
      }
    };

    const handleMutation: MutationCallback = () => {
      const allLinks = document.querySelectorAll('a');
      allLinks.forEach((link) => {
        // Prevent adding multiple listeners
        if (link.dataset.listenerAdded) return;

        link.addEventListener('click', handleAnchorClick);
        link.dataset.listenerAdded = 'true';
      });
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { childList: true, subtree: true });
    handleMutation(); // Initial run

    return () => {
      observer.disconnect();
       document.querySelectorAll('a').forEach((link) => {
        link.removeEventListener('click', handleAnchorClick);
        delete link.dataset.listenerAdded;
      });
    };
  }, []);

  return (
    <>
      {loading && <Loader />}
      {children}
    </>
  );
}
