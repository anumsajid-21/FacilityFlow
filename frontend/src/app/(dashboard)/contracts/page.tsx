"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSignature, Building2, HardHat } from "lucide-react";
import { contractsApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Loading, StatusBadge } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { money, dateShort } from "@/lib/utils";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[] | null>(null);
  useEffect(() => { contractsApi.list({ limit: 50 }).then((p) => setContracts(p.data)).catch(() => setContracts([])); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" subtitle="Active agreements and their related jobs" />

      {!contracts ? <Loading /> : contracts.length === 0 ? (
        <Card><EmptyState icon={<FileSignature className="h-6 w-6" />} title="No contracts yet" description="Contracts are created once a quotation is accepted." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contracts.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-charcoal">{c.title || c.serviceName || "Contract"}</h3>
                  <p className="text-xs text-sage">{c.provider?.name} · {c.organization?.name}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-charcoal">{money(c.price)}</span>
                  <span className="text-xs text-sage">{c.frequency ? `${c.frequency}` : "one-time"} · {dateShort(c.startDate)}{c.endDate ? ` – ${dateShort(c.endDate)}` : ""}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="flex items-center gap-1.5 text-sage"><Building2 className="h-4 w-4" /> {c.building?.name || "—"}</span>
                  <span className="flex items-center gap-1.5 text-sage"><HardHat className="h-4 w-4" /> {c.jobs?.length ?? 0} jobs</span>
                </div>
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Link href={`/contracts/${c.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">View details</Button></Link>
                  {c.jobs?.length ? <Link href="/jobs"><Button size="sm">Jobs</Button></Link> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}