"use client";

import Link from "next/link";
import { ReactNode } from "react";

export interface HeaderProps {
  brand?: ReactNode;
  brandHref?: string;
  children?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export default function Header({
  brand = (
    <>
      Sajilo<span className="text-primary">Blog</span>
    </>
  ),
  brandHref = "/",
  children,
  className = "",
  sticky = true,
}: HeaderProps) {
  return (
    <header
      className={[
        "border-b bg-white/80 backdrop-blur",
        sticky ? "sticky top-0 z-40" : "",
        className,
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link
          href={brandHref}
          className="text-xl font-bold tracking-tight text-foreground hover:text-primary no-underline"
        >
          {brand}
        </Link>
        {children && (
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {children}
          </nav>
        )}
      </div>
    </header>
  );
}
