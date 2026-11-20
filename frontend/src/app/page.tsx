"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-500 text-canvas font-black text-2xl flex items-center justify-center shadow-glow-md animate-bounce mb-3">
        अ
      </div>
      <p className="text-sm font-semibold text-gray-400 animate-pulse">Loading ArthSetu...</p>
    </div>
  );
}
