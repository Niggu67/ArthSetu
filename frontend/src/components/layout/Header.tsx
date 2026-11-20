"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Globe, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SupportedLanguage } from "@/types";
import { notificationsApi } from "@/lib/api";

export function Header() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(() => {
    if (user?.id) {
      notificationsApi
        .getByUserId(user.id)
        .then((notifs) => {
          const unread = notifs.filter((n) => !n.read_status).length;
          setUnreadCount(unread);
        })
        .catch(() => {
          // Graceful fallback
        });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Re-sync badge when dashboard marks a notification as read
  useEffect(() => {
    const handler = () => fetchUnreadCount();
    window.addEventListener("notif-read", handler);
    return () => window.removeEventListener("notif-read", handler);
  }, [fetchUnreadCount]);

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "mr", label: "मराठी" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#071A13]/85 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile Brand Logo */}
        <Link href="/dashboard" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-[#071A13] font-black text-lg shadow-glow-brand/30">
            अ
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              ArthSetu
            </span>
            <span className="text-[10px] font-bold text-brand-400 tracking-wider uppercase block">
              अर्थसेतू
            </span>
          </div>
        </Link>
        <div className="hidden md:block">
          <h1 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            {user?.business_name ? (
              <>
                <span className="text-white font-bold">{user.business_name}</span>
                {user.business_type && (
                  <span className="text-[11px] text-brand-300 font-medium bg-brand-400/10 px-2 py-0.5 rounded-md border border-brand-400/25">
                    {t.onboarding.businessTypes[user.business_type] || user.business_type}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400">{t.tagline}</span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switcher */}
        <div className="relative flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/10 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1 hidden sm:block" />
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                language === lang.code
                  ? "bg-brand-400 text-[#071A13] shadow-xs font-black"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              aria-label={`Switch language to ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Notifications Icon */}
        <Link
          href="/dashboard#notifications"
          className="relative p-2 rounded-xl text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-400 ring-2 ring-[#071A13]" />
            </span>
          )}
        </Link>

        {/* User Avatar / Profile link */}
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400/30 to-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-400/40 shadow-2xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-gray-200 hidden lg:inline max-w-[120px] truncate">
              {user.name.split(" ")[0]}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
