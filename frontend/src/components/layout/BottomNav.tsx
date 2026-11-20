"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BookOpen, Sparkles, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: "/dashboard", label: t.nav.home, icon: Home },
    { href: "/schemes", label: t.nav.schemes, icon: FileText },
    { href: "/learn", label: t.nav.learn, icon: BookOpen },
    { href: "/ai", label: t.nav.ai, icon: Sparkles, special: true },
    { href: "/profile", label: t.nav.profile, icon: UserIcon },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071A13]/90 backdrop-blur-lg border-t border-white/[0.08] shadow-elevation-3 safe-area-pb"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 rounded-xl",
                isActive
                  ? "text-brand-300 font-bold"
                  : "text-gray-400 hover:text-white active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-200 ease-spring-gentle",
                  isActive
                    ? "bg-brand-400/20 text-brand-300 shadow-glow-brand/30 scale-105"
                    : item.special
                    ? "bg-white/[0.06] text-brand-400"
                    : "text-gray-400 group-hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 transition-transform duration-200",
                    isActive && "scale-105 stroke-[2.3]"
                  )}
                />
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-[62px] text-center">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-brand-400 shadow-glow-brand" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
