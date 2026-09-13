"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Tag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, ready, setAuth } = useAuthStore();

  useEffect(() => {
    if (ready && isAuthenticated) router.push("/dashboard");
  }, [ready, isAuthenticated, router]);

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuth(data.user, data.access_token);
        router.push(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  };

  const STEPS = [
    {
      icon: <FileText className="h-5 w-5 text-[#193225]" />,
      label: "Request",
      desc: "Create & dispatch facility service requests",
    },
    {
      icon: <Tag className="h-5 w-5 text-[#C5A059]" />,
      label: "Quote",
      desc: "Receive & compare competitive provider estimates",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-[#193225]" />,
      label: "Contract",
      desc: "Automate binding contracts & SLA terms",
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      label: "Complete",
      desc: "Inspect proof of work & issue instant approvals",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F9F8F6] text-[#222222] font-sans selection:bg-[#C5A059]/30 p-4 sm:p-6 lg:p-8">
      {/* Header Navigation */}
      <header className="mx-auto w-full max-w-6xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#193225] text-base font-bold text-[#C5A059] shadow-md">
            FF
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#193225]">FacilityFlow</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-[#193225]/20 text-[#193225] hover:bg-[#193225]/5 font-semibold">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#E8A248] text-white hover:bg-[#d49037] shadow-md font-semibold px-5">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="mx-auto w-full max-w-4xl my-auto py-8 sm:py-12 text-center flex flex-col items-center space-y-6">
        {/* Category Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#193225]/15 bg-[#193225]/5 px-4 py-1.5 text-xs font-semibold text-[#193225]">
          B2B Facility Operations Platform
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-[#193225] leading-tight tracking-tight max-w-3xl">
          Reliable facility operations, <br />
          run with clarity.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-[#555555] leading-relaxed max-w-2xl">
          Connect with vetted service providers, manage requests and quotations, and track every job from schedule to approval — in one place.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/register">
            <Button size="lg" className="bg-[#E8A248] text-white hover:bg-[#d49037] shadow-md text-base px-7 h-12 font-bold gap-2">
              Hire a Service <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" className="bg-[#193225] text-white hover:bg-[#12251B] shadow-md text-base px-7 h-12 font-bold">
              Become a Provider
            </Button>
          </Link>
        </div>

        {/* 1. Trust Bar — Thin strip below hero buttons */}
        <div className="w-full max-w-3xl pt-6 pb-2 border-y border-[#193225]/10 my-4">
          <p className="text-xs sm:text-sm font-medium text-[#777777] text-center flex flex-wrap justify-center items-center gap-2 sm:gap-4">
            <span>50+ verified providers</span>
            <span className="text-[#C5A059] font-bold">•</span>
            <span>200+ jobs completed</span>
            <span className="text-[#C5A059] font-bold">•</span>
            <span>99.8% SLA rate</span>
            <span className="text-[#C5A059] font-bold">•</span>
            <span>Trusted by facility teams</span>
          </p>
        </div>

        {/* 2. How it works — 4 step row */}
        <div className="w-full max-w-4xl pt-4">
          <div className="text-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#193225]">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, idx) => (
              <div
                key={step.label}
                className="flex flex-col items-start p-4 rounded-xl border border-[#193225]/15 bg-white shadow-sm hover:border-[#193225]/30 transition-all text-left"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#193225]/5 border border-[#193225]/10">
                    {step.icon}
                  </div>
                  <span className="text-[11px] font-bold text-[#C5A059]">Step 0{idx + 1}</span>
                </div>
                <h3 className="font-bold text-sm text-[#193225]">{step.label}</h3>
                <p className="mt-1 text-xs text-[#555555] leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#193225]">Instant Demo Access</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              onClick={() => handleQuickDemoLogin("hiring@facilityflow.app", "Hire@12345")}
              className="px-3.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
            >
              Hiring Org Demo
            </button>
            <button
              onClick={() => handleQuickDemoLogin("provider@facilityflow.app", "Provide@12345")}
              className="px-3.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 transition-colors"
            >
              Provider Demo
            </button>
            <button
              onClick={() => handleQuickDemoLogin("admin@facilityflow.app", "Admin@12345")}
              className="px-3.5 py-1.5 rounded-lg border border-[#193225]/20 bg-[#193225]/5 text-[#193225] font-semibold hover:bg-[#193225]/10 transition-colors"
            >
              Admin Cockpit Demo
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl py-3 border-t border-[#193225]/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#777777]">
        <span>© {new Date().getFullYear()} FacilityFlow. Enterprise Facility Operations.</span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-[#193225]">Sign in</Link>
          <Link href="/register" className="hover:text-[#193225]">Get started</Link>
        </div>
      </footer>
    </div>
  );
}
