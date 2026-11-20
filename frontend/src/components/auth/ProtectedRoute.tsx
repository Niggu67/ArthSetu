"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-400 to-brand-500 text-[#071A13] font-black text-2xl flex items-center justify-center shadow-glow-brand animate-pulse mb-4">
          अ
        </div>
        <p className="text-sm font-bold text-white tracking-wide">Loading ArthSetu...</p>
        <span className="text-xs text-brand-300 font-medium mt-1">Preparing your financial gateway</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
