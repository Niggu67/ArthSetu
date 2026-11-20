import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "navy" | "ochre" | "neutral" | "success" | "warning";
  withDot?: boolean;
  pulseDot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  withDot = false,
  pulseDot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    brand: "bg-brand-400/15 text-brand-300 border-brand-400/30",
    navy: "bg-emerald-950/70 text-emerald-200 border-emerald-500/25",
    ochre: "bg-ochre-500/15 text-ochre-300 border-ochre-500/30",
    neutral: "bg-white/[0.08] text-gray-300 border-white/15",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  };

  const dotColors = {
    brand: "bg-brand-400",
    navy: "bg-emerald-400",
    ochre: "bg-ochre-400",
    neutral: "bg-gray-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors shadow-2xs backdrop-blur-xs",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className="relative flex h-2 w-2 items-center justify-center shrink-0" aria-hidden="true">
          {pulseDot && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn("relative inline-flex w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
}
