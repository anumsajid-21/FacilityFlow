"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HardHat, ArrowRight, AlertTriangle } from "lucide-react";
import { jobsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader, EmptyState, Loading, StatusBadge } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { dateShort } from "@/lib/utils";

const COLUMNS = [
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "AWAITING_APPROVAL", label: "Awaiting Approval" },
  { key: "REWORK", label: "Rework" },
];

export default function JobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[] | null>(null);
  useEffect(() => { jobsApi.list({ limit: 100 }).then((p) => setJobs(p.data)).catch(() => setJobs([])); }, []);

  const byCol = (key: string) => (jobs ?? []).filter((j) => j.status === key);
  const done = (jobs ?? []).filter((j) => j.status === "COMPLETED" || j.status === "AWAITING_APPROVAL" || j.status === "REWORK").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" subtitle={user?.role === "PROVIDER" ? "Today's work and upcoming assignments" : "Workflow across your active contracts"} actions={<Link href="/jobs"><Button>View workflow</Button></Link>} />

      {jobs && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4"><p className="text-xs text-sage">Total jobs</p><p className="mt-1 text-2xl font-bold text-charcoal">{jobs.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-sage">Upcoming</p><p className="mt-1 text-2xl font-bold text-charcoal">{byCol("SCHEDULED").length}</p></Card>
          <Card className="p-4"><p className="text-xs text-sage">In progress</p><p className="mt-1 text-2xl font-bold text-terracotta">{byCol("IN_PROGRESS").length}</p></Card>
          <Card className="p-4"><p className="text-xs text-sage">Completed / awaiting</p><p className="mt-1 text-2xl font-bold text-pine">{done}</p></Card>
        </div>
      )}

      {!jobs ? <Loading /> : jobs.length === 0 ? (
        <Card><EmptyState icon={<HardHat className="h-6 w-6" />} title="No jobs yet" description="Jobs are generated from your active contracts." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = byCol(col.key);
            return (
              <div key={col.key} className="rounded-xl border border-border bg-muted/40 p-2">
                <p className="mb-2 flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase text-sage">
                  {col.label} <span className="rounded-full bg-ivory px-1.5 text-[11px] text-charcoal">{items.length}</span>
                </p>
                <div className="space-y-2">
                  {items.length === 0 ? <p className="px-2 py-6 text-center text-xs text-sage">Empty</p> : items.map((j) => (
                    <Card key={j.id} className="group p-3 transition-all hover:border-brass">
                      <Link href={`/jobs/${j.id}`}>
                        <p className="flex items-start justify-between gap-2">
                          <span className="line-clamp-1 text-sm font-medium text-charcoal group-hover:text-pine">{j.title || j.serviceName || "Job"}</span>
                          <StatusBadge status={j.status} className="shrink-0" />
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-sage"><HardHat className="h-3 w-3" /> {dateShort(j.date)} · {j.contract?.provider?.name || j.contract?.organization?.name}</p>
                        {j.sla?.status === "BREACHED" && <span className="mt-2 flex items-center gap-1 text-xs font-medium text-terracotta"><AlertTriangle className="h-3 w-3" /> SLA breached</span>}
                        <span className="mt-2 hidden items-center gap-1 text-xs font-medium text-pine group-hover:flex"><ArrowRight className="h-3 w-3" /> Open</span>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}