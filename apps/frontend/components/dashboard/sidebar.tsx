"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export interface SidebarLink {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  links: SidebarLink[];
  title?: string;
  footer?: ReactNode;
  className?: string;
  collapsed?: boolean;
}

export default function Sidebar({
  links,
  title,
  footer,
  className = "",
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "flex flex-col border-r bg-white",
        collapsed ? "w-16" : "w-64",
        className,
      ].join(" ")}
    >
      {title && (
        <div
          className={[
            "border-b px-4 py-4 font-bold text-foreground",
            collapsed ? "px-2 text-center text-xs" : "",
          ].join(" ")}
        >
          {collapsed ? title.charAt(0) : title}
        </div>
      )}
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors no-underline",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed ? "justify-center px-2" : "",
              ].join(" ")}
              title={collapsed ? link.label : undefined}
            >
              {link.icon && <span className="shrink-0">{link.icon}</span>}
              {!collapsed && (
                <>
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      {link.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
      {footer && (
        <div className="border-t p-3">{footer}</div>
      )}
    </aside>
  );
}
