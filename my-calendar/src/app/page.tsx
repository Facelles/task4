"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
import AppLayout from "./components/Layout/AppLayout";
import CalendarComponent from "./components/Calendar/CalendarComponent";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );

  if (!user) return null;

  return (
    <AppLayout title="My calander" subtitle={`Вітаємо, ${user.email}`}>
      <CalendarComponent />
    </AppLayout>
  );
}
