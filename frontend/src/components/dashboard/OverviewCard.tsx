import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  href?: string;
  color?: "brand" | "navy" | "ochre" | "neutral";
  isLoading?: boolean;
}

export function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color = "brand",
  isLoading = false,
}: OverviewCardProps) {
  const colorStyles = {
    brand: {
      accent: "from-brand-400 via-brand-500 to-emerald-400",
      iconBg: "bg-brand-400/15 text-brand-300 border border-brand-400/25",
    },
    navy: {
      accent: "from-emerald-400 via-teal-500 to-cyan-400",
      iconBg: "bg-teal-500/15 text-teal-300 border border-teal-500/25",
    },
    ochre: {
      accent: "from-ochre-400 via-ochre-500 to-amber-300",
      iconBg: "bg-ochre-500/15 text-ochre-300 border border-ochre-500/25",
    },
    neutral: {
      accent: "from-gray-400 to-gray-500",
      iconBg: "bg-white/[0.08] text-gray-300 border border-white/10",
    },
  };

  const Content = (
    <Card
      hoverable={!!href}
      className="flex flex-col justify-between min-h-[148px] sm:min-h-[160px] h-full relative overflow-hidden group p-5 sm:p-6 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] hover:border-brand-400/40 shadow-card"
    >
      {/* Subtle top ambient tint */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          colorStyles[color].accent
        )}
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-snug">
          {title}
        </span>
        <div
          className={cn(
            "p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 duration-200 shadow-2xs",
            colorStyles[color].iconBg
          )}
        >
          <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="my-auto py-2">
        {isLoading ? (
          <div className="h-8 w-20 bg-white/10 rounded-lg shimmer-effect" />
        ) : (
          <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight block">
            {value}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08] text-xs text-gray-400 mt-auto">
        <span className="text-[11px] sm:text-xs text-gray-400 font-medium leading-tight line-clamp-1 pr-1">
          {subtitle}
        </span>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-brand-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 ease-spring-gentle shrink-0" />
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full group focus:outline-none focus:ring-2 focus:ring-brand-400 rounded-2xl"
      >
        {Content}
      </Link>
    );
  }

  return Content;
}
