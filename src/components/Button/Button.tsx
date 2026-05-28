"use client";

import React from "react";
import { cn } from "@/ui/lib/utils";

export interface ButtonRootProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  variant?:
    | "brand-primary"
    | "brand-secondary"
    | "brand-tertiary"
    | "neutral-primary"
    | "neutral-secondary"
    | "neutral-tertiary"
    | "destructive-primary"
    | "destructive-secondary"
    | "destructive-tertiary"
    | "inverse";
  size?: "large" | "medium" | "small";
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 animate-spin", className)}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="40 60"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  function ButtonRoot(
    {
      disabled = false,
      variant = "brand-primary",
      size = "medium",
      children,
      icon = null,
      iconRight = null,
      loading = false,
      className,
      type = "button",
      ...otherProps
    }: ButtonRootProps,
    ref
  ) {
    const textColor = cn("text-white", {
      "text-error-700":
        variant === "destructive-tertiary" || variant === "destructive-secondary",
      "text-neutral-700":
        variant === "neutral-tertiary" ||
        variant === "neutral-secondary" ||
        variant === "neutral-primary",
      "text-brand-700":
        variant === "brand-tertiary" || variant === "brand-secondary",
    });
    return (
      <button
        className={cn(
          "group flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-brand-600 px-3 text-left hover:bg-brand-500 active:bg-brand-600 disabled:cursor-default disabled:bg-neutral-200",
          {
            "h-6 gap-1 px-2": size === "small",
            "h-10 px-4": size === "large",
            "bg-transparent hover:bg-[#ffffff29] active:bg-[#ffffff3d]":
              variant === "inverse",
            "bg-transparent hover:bg-error-50 active:bg-error-100":
              variant === "destructive-tertiary",
            "bg-error-50 hover:bg-error-100 active:bg-error-50":
              variant === "destructive-secondary",
            "bg-error-600 hover:bg-error-500 active:bg-error-600":
              variant === "destructive-primary",
            "bg-transparent hover:bg-neutral-100 active:bg-neutral-200":
              variant === "neutral-tertiary",
            "border border-solid border-neutral-border bg-default-background hover:bg-neutral-50":
              variant === "neutral-secondary",
            "bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-100":
              variant === "neutral-primary",
            "bg-transparent hover:bg-brand-50 active:bg-brand-100":
              variant === "brand-tertiary",
            "bg-brand-50 hover:bg-brand-100 active:bg-brand-50":
              variant === "brand-secondary",
          },
          className
        )}
        ref={ref}
        type={type}
        disabled={disabled}
        {...otherProps}
      >
        {icon ? (
          <span
            className={cn(
              "inline-flex items-center [&_svg]:size-4 text-body font-body",
              { hidden: loading, "[&_svg]:size-5 text-heading-3 font-heading-3": size === "large" },
              textColor
            )}
          >
            {icon}
          </span>
        ) : null}
        {loading ? <Spinner className={cn("size-4", textColor)} /> : null}
        {children ? (
          <span
            className={cn(
              "whitespace-nowrap text-body-bold font-body-bold",
              { hidden: loading, "text-caption-bold font-caption-bold": size === "small" },
              textColor
            )}
          >
            {children}
          </span>
        ) : null}
        {iconRight ? (
          <span
            className={cn(
              "inline-flex items-center [&_svg]:size-4 text-body font-body",
              { "[&_svg]:size-5 text-heading-3 font-heading-3": size === "large" },
              textColor
            )}
          >
            {iconRight}
          </span>
        ) : null}
      </button>
    );
  }
);

export const Button = ButtonRoot;
