import { SupportedLanguage } from "@/types";
import { Translations } from "./types";
import { en } from "./translations/en";
import { hi } from "./translations/hi";
import { mr } from "./translations/mr";

export * from "./types";

export const translations: Record<SupportedLanguage, Translations> = {
  en,
  hi,
  mr,
};

/**
 * Safe translation getter with fallback to English if key or text is missing.
 */
export function getTranslation(lang: SupportedLanguage): Translations {
  return translations[lang] || translations.en;
}

/**
 * Helper to interpolate dynamic variables like {name}, {count}, {percent}
 */
export function formatString(template: string, vars: Record<string, string | number>): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
  });
}
