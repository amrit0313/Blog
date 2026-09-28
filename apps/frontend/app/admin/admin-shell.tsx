// app/admin/admin-shell.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar, Box, CircularProgress, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography,
  withTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import Image from "next/image";
import NepalCanLogo from "../../public/navbar-logo-short-v3 (1).png";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
const drawerWidth = 240;
const links = [
  { href: "/admin", label: "Overview", icon: <DashboardIcon /> },
  { href: "/admin/blogs", label: "Blogs", icon: <ArticleIcon /> },
  { href: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
  { href: "/admin/users", label: "Users", icon: <PeopleIcon /> },
  { href: "/admin/profile", label: "Profile", icon: <PeopleIcon /> },

];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const notified = useRef(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isLoading || isAdmin || notified.current) return;
    notified.current = true; // stops duplicate toasts (React strict mode runs effects twice in dev)

    if (!user) {
      toast.error("Please log in to continue.");
      router.replace("/login");
    } else {
      toast.error("You don't have access to this page.");
      router.replace("/");
    }
  }, [isLoading, isAdmin, user, router]);

  if (isLoading || !isAdmin) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
  position="fixed"
  color="inherit"      // drops the red primary background
  elevation={0}        // removes the shadow
  sx={{
    zIndex: (t) => t.zIndex.drawer + 1,
    bgcolor: "rgba(255,255,255,0.8)",   // bg-white/80
    backdropFilter: "blur(8px)",        // backdrop-blur
    borderBottom: 1,                    // border-b (1px solid)
    borderColor: "divider",             // uses theme.palette.divider (#eadfd6)
  }}
>
  <Toolbar sx={{ px: { xs: 3, lg: 4 }, py: 1 }}>
    <Link
      href="/"
      className="flex items-center gap-2 text-xl font-bold tracking-tight hover:text-primary"
    >
      <Image src={NepalCanLogo} className="h-8 w-8" alt="Nepal Can Blog logo" />
      Nepal Can<span className="text-black"> Blog</span>
    </Link>
    <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
      {user && (
        <Typography component="span" variant="body1" sx={{ fontWeight: 700, mr: 4, color:"primary.main"}}>
          {user.name}
        </Typography>
      )}
      <Box
        onClick={handleLogout}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleLogout(); }}
        sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { color: "error.main" } }}
        title="Logout"
      >
        <LogoutIcon fontSize="small" />
        <Typography component="span" variant="body2" sx={{ fontWeight: 500,color:"primary.main" }}>Logout</Typography>
      </Box>
    </Box>
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
        <List sx={{pt:2}}>
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
 