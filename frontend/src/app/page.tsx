"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuthStore();

  useEffect(() => {
    if (ready && isAuthenticated) router.push("/dashboard");
  }, [ready, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col bg-sand text-charcoal">
      <header className="px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine text-sm font-bold text-brass">FF</div>
            <span className="text-lg font-bold text-pine">FacilityFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="outline">Sign in</Button></Link>
            <Link href="/register"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-brass/40 bg-brass-soft px-3 py-1 text-xs font-medium text-[#7A5E2E]">
            B2B Facility Operations Platform
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-pine sm:text-5xl">
            Reliable facility operations, run with clarity.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-sage">
            Connect with vetted service providers, manage requests and quotations,
            and track every job from schedule to approval — in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register"><Button size="lg">Hire a Service</Button></Link>
            <Link href="/register"><Button size="lg" variant="secondary">Become a Provider</Button></Link>
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 text-center text-xs text-sage">
        © {new Date().getFullYear()} FacilityFlow. Built for facility teams.
      </footer>
    </div>
  );
}
