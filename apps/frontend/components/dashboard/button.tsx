"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  type?: "submit" | "button" | "reset";
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-[#c92f3d] shadow-sm",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-[#f5e0d0]",
  outline:
    "border border-border bg-card text-foreground hover:border-primary hover:text-primary",
  ghost:
    "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
