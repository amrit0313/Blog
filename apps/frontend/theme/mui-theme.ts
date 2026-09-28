// lib/mui-theme.ts
"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true, // lets MUI expose its own vars, optional but handy
  palette: {
    primary: { main: "#e63946", dark: "#b92535", contrastText: "#ffffff" },
    secondary: { main: "#f4a261" },
    background: { default: "#fffaf5", paper: "#ffffff" },
    text: { primary: "#16213e", secondary: "#6b7280" },
    divider: "#eadfd6",
  },
  shape: { borderRadius: 10 }, // matches --radius: 0.625rem
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
    button: { textTransform: "none", fontWeight: 500 },
  },
});

export default theme;