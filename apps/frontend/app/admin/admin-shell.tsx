// app/admin/admin-shell.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar, Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import Image from "next/image";
import NepalCanLogo from "../../public/navbar-logo-short-v3 (1).png"
const drawerWidth = 240;
const links = [
  { href: "/admin", label: "Overview", icon: <DashboardIcon /> },
  { href: "/admin/blogs", label: "Blogs", icon: <ArticleIcon /> },
  { href: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
  { href: "/admin/users", label: "Users", icon: <PeopleIcon /> },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Link
          href="/"
          className="flex w-2xl items-center gap-2 text-xl font-bold  tracking-tight  hover:text-primary"
        >
          <Image src={NepalCanLogo} className="w-8 h-8" alt="error" />
          Nepal Can<span className="text-black"> Blog</span>
        </Link>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {links.map((l) => (
            <ListItemButton
              key={l.href}
              component={Link}
              href={l.href}
              selected={pathname === l.href}
            >
              <ListItemIcon>{l.icon}</ListItemIcon>
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}