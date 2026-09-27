"use client";

import { ReactNode } from "react";
import {HiSquares2X2, HiPencilSquare, HiChartBar } from "react-icons/hi2";
import DashboardLayout from "../../../components/dashboard/layout";
import type { SidebarLink } from "../../../components/dashboard/sidebar";

const userSidebarLinks: SidebarLink[] = [
  { href: "/dashboard/overview", label: "Overview", icon: <HiSquares2X2 className="w-4.5 h-4.5" /> },
  { href: "/dashboard/blogs", label: "Blogs", icon: <HiPencilSquare className="w-4.5 h-4.5" /> },
  { href: "/dashboard/my-blogs", label: "My Blogs", icon: <HiPencilSquare className="w-4.5 h-4.5" /> },
 // { href: "/dashboard/analytics", label: "Analytics", icon: <HiChartBar className="w-4.5 h-4.5" /> },
  //{ href: "/dashboard/settings", label: "Settings", icon: <Cog6ToothIcon className="w-[18px] h-[18px]" /> },
];

export default function UserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardLayout
      sidebarLinks={userSidebarLinks}
      sidebarTitle="My Dashboard"
      headerBrand={
        <>
          NepalCan<span className="text-primary">Blog</span>
        </>
      }
      headerBrandHref="/dashboard"
    >
      {children}
    </DashboardLayout>
  );
}
