import { ReactNode } from "react";
import Sidebar, { SidebarLink } from "./sidebar";
import Header from "./header";
import Footer from "./footer";

export interface DashboardLayoutProps {
  children: ReactNode;
  sidebarLinks: SidebarLink[];
  sidebarTitle?: string;
  sidebarFooter?: ReactNode;
  headerBrand?: ReactNode;
  headerBrandHref?: string;
  headerChildren?: ReactNode;
  footerChildren?: ReactNode;
  sidebarCollapsed?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function DashboardLayout({
  children,
  sidebarLinks,
  sidebarTitle,
  sidebarFooter,
  headerBrand,
  headerBrandHref,
  headerChildren,
  footerChildren,
  sidebarCollapsed = false,
  showHeader = true,
  showFooter = true,
  className = "",
}: DashboardLayoutProps) {
  return (
    <div className={["flex min-h-screen", className].join(" ")}>
      <Sidebar
        links={sidebarLinks}
        title={sidebarTitle}
        footer={sidebarFooter}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 flex-col">
        {showHeader && (
          <Header brand={headerBrand} brandHref={headerBrandHref}>
            {headerChildren}
          </Header>
        )}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
        {showFooter && <Footer>{footerChildren}</Footer>}
      </div>
    </div>
  );
}
