import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "amber";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 ease-spring-gentle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#071A13] active:scale-[0.97] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:translate-y-0 select-none cursor-pointer tracking-tight";

    const sizeStyles = {
      sm: "min-h-[36px] px-3.5 py-1.5 text-xs gap-1.5",
      md: "min-h-[44px] px-5 py-2 text-sm gap-2", // Min 44px touch target
      lg: "min-h-[50px] px-6 py-2.5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-brand-400 via-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 active:from-brand-600 active:to-brand-600 text-[#071A13] shadow-md hover:shadow-glow-brand focus:ring-brand-400 border border-brand-300/40",
      secondary:
        "bg-white/10 hover:bg-white/15 active:bg-white/20 text-white shadow-sm border border-white/15 focus:ring-brand-400 hover:border-brand-400/40",
      outline:
        "border border-white/15 text-gray-200 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white hover:border-brand-400/50 shadow-sm focus:ring-brand-400",
      ghost:
        "text-gray-300 hover:bg-white/[0.06] hover:text-white focus:ring-brand-400 hover:translate-y-0",
      amber:
        "bg-gradient-to-r from-ochre-500 to-ochre-600 hover:from-ochre-400 hover:to-ochre-500 text-white shadow-md hover:shadow-glow-amber focus:ring-ochre-400 border border-ochre-400/40",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
