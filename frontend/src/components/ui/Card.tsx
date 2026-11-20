import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: "default" | "elevated" | "glass" | "subtle" | "brand-accent" | "featured";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hoverable = false,
      variant = "default",
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "bg-[#0C231A]/80 backdrop-blur-md border border-white/[0.08] shadow-card text-charcoal-800",
      elevated: "bg-[#102A1E]/90 backdrop-blur-lg border border-white/12 shadow-elevation-2 text-charcoal-800",
      glass: "bg-white/[0.035] backdrop-blur-xl border border-white/[0.1] shadow-card text-charcoal-800",
      subtle: "bg-[#0B2118]/60 border border-white/[0.06] text-charcoal-800",
      "brand-accent": "bg-gradient-to-br from-[#102A1E] via-[#0C231A] to-[#071A13] border border-brand-400/30 shadow-card text-charcoal-800",
      featured: "bg-[#0E271D] border border-brand-400/40 shadow-elevation-2 relative text-charcoal-800",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-5 sm:p-6 transition-all duration-200 ease-spring-gentle relative overflow-hidden",
          variantStyles[variant],
          hoverable &&
            "hover:shadow-card-hover hover:border-brand-400/40 hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-[0.995]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
