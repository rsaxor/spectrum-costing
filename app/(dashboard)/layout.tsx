"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in
        setIsAuthenticated(true);
      } else {
        // User is NOT logged in
        setIsAuthenticated(false);
        router.push("/login");
      }
      // Regardless of result, we are done checking
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 1. Show loading spinner while Firebase checks session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          <p className="text-sm font-medium text-slate-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 2. If check is done but not authenticated, return null (router.push handles redirect)
  if (!isAuthenticated) {
    return null;
  }

  // 3. Authenticated! Render the Dashboard (Calculator)
  return <>{children}</>;
}