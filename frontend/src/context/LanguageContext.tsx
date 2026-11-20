"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { SupportedLanguage } from "@/types";
import { Translations, getTranslation, formatString } from "@/i18n";

export type { Translations };

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  format: (template: string, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  // Synchronize language from localStorage on initial client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // First check user's saved preference in localStorage
    const saved = localStorage.getItem("arthsetu_lang") as SupportedLanguage;
    if (saved && (saved === "en" || saved === "hi" || saved === "mr")) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      return;
    }

    // Secondary check: user object in localStorage
    try {
      const userStr = localStorage.getItem("arthsetu_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.language_preference && ["en", "hi", "mr"].includes(u.language_preference)) {
          setLanguageState(u.language_preference as SupportedLanguage);
          localStorage.setItem("arthsetu_lang", u.language_preference);
          document.documentElement.lang = u.language_preference;
        }
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (lang !== "en" && lang !== "hi" && lang !== "mr") return;
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("arthsetu_lang", lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent("arthsetu-language-change", { detail: { language: lang } }));
    }
  }, []);

  // Listen for language changes dispatched from other components/windows
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.language && detail.language !== language) {
        setLanguageState(detail.language);
      }
    };
    window.addEventListener("arthsetu-language-change", handleLangChange);
    return () => window.removeEventListener("arthsetu-language-change", handleLangChange);
  }, [language]);

  const t = useMemo(() => getTranslation(language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, format: formatString }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
