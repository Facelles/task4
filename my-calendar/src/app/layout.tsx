"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "../theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
