"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready, restore } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) void restore();
  }, [ready, restore]);

  useEffect(() => {
    if (ready && !isAuthenticated) router.push("/login");
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
