import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground transition-colors hover:bg-[#c92f3d] disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "border bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60",
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
