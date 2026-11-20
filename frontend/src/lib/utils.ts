import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function getGreeting(lang: string = "en"): string {
  const hour = new Date().getHours();
  if (lang === "hi") {
    if (hour < 12) return "शुभ प्रभात";
    if (hour < 17) return "शुभ दोपहर";
    return "शुभ संध्या";
  }
  if (lang === "mr") {
    if (hour < 12) return "शुभ प्रभात";
    if (hour < 17) return "शुभ दुपार";
    return "शुभ संध्या";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Strips markdown syntax (headers, bold, lists, horizontal rules, links)
 * to provide clean, natural-sounding plain text for Text-to-Speech (TTS).
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return "";
  return markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove headers (# Heading)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold & italic (***text***, **text**, *text*, ___text___, __text__, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove blockquotes (> quote)
    .replace(/^\s*>\s+/gm, "")
    // Remove horizontal rules (---, ***, ___)
    .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
    // Remove bullet list markers (*, -, +)
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove numbered list markers (1., 2.)
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Collapse excessive blank lines
    .replace(/\n{2,}/g, "\n")
    .trim();
}

