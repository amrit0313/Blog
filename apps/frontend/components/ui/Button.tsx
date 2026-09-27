import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    `${baseStyles} bg-primary text-primary-foreground shadow-sm hover:bg-[#c92f3d] disabled:cursor-not-allowed disabled:opacity-60`,
  outline:
    `${baseStyles} border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60`,
  ghost:
    `${baseStyles} text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60`,
};

export default function Button({
  children,
  className = "",
  disabled,
  href,
  onClick,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = `${variantStyles[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
