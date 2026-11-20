"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex text-charcoal-800 font-sans relative selection:bg-brand-400 selection:text-black">
      {/* Subtle atmospheric ambient glow meshes inspired by the reference */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-brand-400/[0.04] rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed top-1/3 right-0 w-[500px] h-[450px] bg-emerald-500/[0.03] rounded-full blur-[160px] pointer-events-none -z-0" />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
