import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function dateShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function dateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(d: string | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tailwind classes per status — earth palette. */
export const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-sage border-border",
  OPEN: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  QUOTATIONS_RECEIVED: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  UNDER_REVIEW: "bg-[#EAE0F0] text-[#5B4A6B] border-[#C9B8DB]",
  PROVIDER_SELECTED: "bg-pine/10 text-pine border-pine/25",
  ACCEPTED: "bg-pine/10 text-pine border-pine/25",
  SUBMITTED: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  REJECTED: "bg-terracotta-soft text-terracotta border-terracotta/30",
  WITHDRAWN: "bg-muted text-sage border-border",
  EXPIRED: "bg-muted text-sage border-border",
  ACTIVE: "bg-pine/10 text-pine border-pine/25",
  PENDING_APPROVAL: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  COMPLETED: "bg-pine/10 text-pine border-pine/25",
  AWAITING_APPROVAL: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  IN_PROGRESS: "bg-[#E3EBE4] text-[#2F5D3A] border-[#B9CFBC]",
  ASSIGNED: "bg-accent text-pine border-pine/25",
  SCHEDULED: "bg-accent text-pine border-pine/25",
  REWORK: "bg-terracotta-soft text-terracotta border-terracotta/30",
  CANCELLED: "bg-muted text-sage border-border",
  TERMINATED: "bg-terracotta-soft text-terracotta border-terracotta/30",
  CLOSED: "bg-muted text-sage border-border",
  ISSUED: "bg-accent text-pine border-pine/25",
  PENDING: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  PAID: "bg-pine/10 text-pine border-pine/25",
  OVERDUE: "bg-terracotta-soft text-terracotta border-terracotta/30",
  VERIFIED: "bg-pine/10 text-pine border-pine/25",
  DOCUMENTS_SUBMITTED: "bg-brass-soft text-[#7A5E2E] border-brass/40",
  UNVERIFIED: "bg-muted text-sage border-border",
  REJECTED_DOC: "bg-terracotta-soft text-terracotta border-terracotta/30",
};

export function statusClass(s: string | null | undefined): string {
  return statusStyles[s ?? ""] ?? "bg-muted text-sage border-border";
}

export function humanize(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

