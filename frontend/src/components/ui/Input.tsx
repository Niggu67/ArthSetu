import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, leftIcon, rightIcon, id, ...props },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
          >
            {label}
            {props.required && (
              <span className="text-amber-400 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full min-h-[46px] py-2.5 rounded-xl border text-sm text-white bg-[#071A13]/90 placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:bg-white/[0.03] disabled:text-gray-500 disabled:cursor-not-allowed shadow-2xs",
              leftIcon ? "pl-10 pr-4" : rightIcon ? "pl-4 pr-10" : "px-4",
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-white/15 focus:border-brand-400 focus:ring-brand-400/20 focus:shadow-glow-brand",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-rose-400 flex items-center gap-1.5 pt-0.5"
          >
            <span aria-hidden="true">⚠️</span> {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-400 pt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
