"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Chip,
  useTheme,
  alpha,
  Button,
  Stack,
} from "@mui/material";
import {
  CalendarMonth,
  Logout,
  AccountCircle,
  Notifications,
  CalendarToday,
  List,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/app/firebase/config";
import { useRouter, usePathname } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title = "Мій Календар", subtitle }: AppLayoutProps) {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const auth = getAuth(app);
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleMenuClose();
    } catch (error) {
      console.error("error logout:", error);
    }
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          {/* Logo and Title */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: alpha(theme.palette.common.white, 0.2),
                mr: 2,
              }}
            >
              <CalendarMonth sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                fontWeight="bold"
                color="white"
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Status Indicator */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 2 }}>
            <Button
              variant={pathname === "/" ? "contained" : "text"}
              startIcon={<CalendarToday />}
              onClick={() => router.push("/")}
              sx={{
                color: pathname === "/" ? "white" : alpha("#ffffff", 0.8),
                backgroundColor: pathname === "/" ? alpha("#ffffff", 0.2) : "transparent",
                "&:hover": {
                  backgroundColor: alpha("#ffffff", 0.1),
                },
              }}
            >
              Календар
            </Button>
            <Button
              variant={pathname === "/list" ? "contained" : "text"}
              startIcon={<List />}
              onClick={() => router.push("/list")}
              sx={{
                color: pathname === "/list" ? "white" : alpha("#ffffff", 0.8),
                backgroundColor: pathname === "/list" ? alpha("#ffffff", 0.2) : "transparent",
                "&:hover": {
                  backgroundColor: alpha("#ffffff", 0.1),
                },
              }}
            >
              Список
            </Button>
          </Stack>

          <Chip
            label="Онлайн"
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.success.main, 0.2),
              color: theme.palette.success.light,
              border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
              mr: 2,
            }}
          />

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          {/* User Menu */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.8),
                width: 36,
                height: 36,
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {user?.email ? getUserInitials(user.email) : <AccountCircle />}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            sx={{
              "& .MuiPaper-root": {
                borderRadius: 2,
                minWidth: 200,
                mt: 1,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Користувач
              </Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Вийти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}