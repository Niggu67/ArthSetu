"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  CheckCircle2,
  ClipboardList,
  BookOpen,
  Sparkles,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.nav.home, icon: Home },
    { href: "/schemes", label: t.nav.schemes, icon: FileText },
    { href: "/eligibility", label: t.nav.eligibility, icon: CheckCircle2 },
    { href: "/applications", label: t.nav.applications, icon: ClipboardList },
    { href: "/learn", label: t.nav.learn, icon: BookOpen },
    { href: "/ai", label: t.nav.ai, icon: Sparkles, badge: "AI" },
    { href: "/profile", label: t.nav.profile, icon: UserIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B2118] border-r border-white/[0.06] shrink-0 min-h-screen select-none relative z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 via-brand-400 to-brand-500 flex items-center justify-center text-[#071A13] font-black text-xl shadow-glow-brand/50 group-hover:scale-105 transition-transform duration-200">
            अ
          </div>
          <div>
            <span className="font-black text-xl text-white tracking-tight block leading-tight">
              ArthSetu
            </span>
            <span className="text-[11px] font-bold text-brand-300 tracking-wider uppercase block">
              अर्थसेतू • Fintech
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ease-spring-gentle focus:outline-none focus:ring-2 focus:ring-brand-400",
                isActive
                  ? "bg-brand-400/10 text-brand-300 font-bold border border-brand-400/25 shadow-2xs"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 transition-transform duration-200 ease-spring-gentle",
                    isActive
                      ? "text-brand-400 scale-105"
                      : "text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5"
                  )}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-brand-400/20 text-brand-300 border border-brand-400/30 uppercase tracking-wider shadow-2xs">
                  {item.badge}
                </span>
              ) : isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-glow-brand" aria-hidden="true" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Verified Data Guidance Notice */}
      <div className="p-3.5 mx-3.5 mb-3 bg-[#071A13]/80 border border-white/[0.08] rounded-xl backdrop-blur-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4.5 h-4.5 text-brand-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 leading-relaxed">
            <p className="font-bold text-white">
              {language === "mr" ? "प्रमाणित मार्गदर्शन" : language === "hi" ? "सत्यापित मार्गदर्शन" : "Verified Guidance"}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {language === "mr"
                ? "ग्रामीण उद्योजकांसाठी केंद्र आणि राज्य कर्ज मार्गदर्शक तत्त्वे."
                : language === "hi"
                ? "ग्रामीण उद्यमियों के लिए केंद्र व राज्य ऋण दिशानिर्देश।"
                : "Grounded central & state loan guidelines for rural entrepreneurs."}
            </p>
          </div>
        </div>
      </div>

      {/* User Footer & Logout */}
      <div className="p-3.5 border-t border-white/[0.06] space-y-2.5">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-brand-400/30 to-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-400/40 shadow-2xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.business_name || user.phone}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-gray-500 group-hover:text-rose-400" />
          <span>{t.nav.logout}</span>
        </button>
      </div>
    </aside>
  );
}
