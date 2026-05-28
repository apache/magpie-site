"use client";

import React from "react";
import { cn } from "@/ui/lib/utils";

export interface BadgeRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "brand" | "neutral" | "error" | "warning" | "success";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

const BadgeRoot = React.forwardRef<HTMLDivElement, BadgeRootProps>(
  function BadgeRoot(
    {
      variant = "brand",
      icon = null,
      children,
      iconRight = null,
      className,
      ...otherProps
    }: BadgeRootProps,
    ref
  ) {
    const iconColor = cn("text-caption font-caption text-brand-700", {
      "text-success-800": variant === "success",
      "text-warning-800": variant === "warning",
      "text-error-700": variant === "error",
      "text-neutral-700": variant === "neutral",
    });
    return (
      <div
        className={cn(
          "flex h-6 items-center gap-1 rounded-md border border-solid border-brand-100 bg-brand-100 px-2",
          {
            "border-success-100 bg-success-100": variant === "success",
            "border-warning-100 bg-warning-100": variant === "warning",
            "border-error-100 bg-error-100": variant === "error",
            "border-neutral-100 bg-neutral-100": variant === "neutral",
          },
          className
        )}
        ref={ref}
        {...otherProps}
      >
        {icon ? (
          <span className={cn("inline-flex items-center [&_svg]:size-3.5", iconColor)}>
            {icon}
          </span>
        ) : null}
        {children ? (
          <span
            className={cn("whitespace-nowrap text-caption font-caption text-brand-800", {
              "text-success-800": variant === "success",
              "text-warning-800": variant === "warning",
              "text-error-800": variant === "error",
              "text-neutral-700": variant === "neutral",
            })}
          >
            {children}
          </span>
        ) : null}
        {iconRight ? (
          <span className={cn("inline-flex items-center [&_svg]:size-3.5", iconColor)}>
            {iconRight}
          </span>
        ) : null}
      </div>
    );
  }
);

export const Badge = BadgeRoot;
