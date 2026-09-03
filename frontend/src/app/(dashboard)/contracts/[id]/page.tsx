"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, HardHat } from "lucide-react";
import { contractsApi } from "@/services/api";
import { Card, PageHeader, Loading, StatusBadge } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { money, dateShort } from "@/lib/utils";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<any | null>(null);

  useEffect(() => { contractsApi.get(id).then(setC).catch(() => setC(undefined)); }, [id]);
  if (c === undefined) return <div className="rounded-xl border border-border bg-ivory p-6 text-sm text-sage">Contract not found.</div>;
  if (!c) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader title={c.title || c.serviceName || "Contract"} subtitle={`${c.provider?.name} · ${c.organization?.name}`} actions={<><StatusBadge status={c.status} /><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Back</Button></>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <p className="text-xs text-sage">Value</p>
          <p className="mt-1 text-3xl font-bold text-charcoal">{money(c.price)}</p>
          <div className="mt-5 space-y-2 text-sm text-sage">
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-pine" /> {c.building?.name || "Building"}</p>
            <p>Start: {dateShort(c.startDate)}{c.endDate ? ` · End: ${dateShort(c.endDate)}` : ""}</p>
            {c.frequency && <p>Frequency: {c.frequency}</p>}
            {c.paymentTerms && <p>Payment: {c.paymentTerms}</p>}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="border-b border-border px-5 py-4"><h3 className="font-semibold text-charcoal">Related jobs ({c.jobs?.length ?? 0})</h3></div>
          <div className="space-y-2 p-4">
            {c.jobs?.length ? c.jobs.map((j: any) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brass">
                <HardHat className="h-5 w-5 text-terracotta" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal">{j.title || j.serviceName || "Job"}</p>
                  <p className="text-xs text-sage">{dateShort(j.date)}</p>
                </div>
                <StatusBadge status={j.status} />
              </Link>
            )) : <p className="py-8 text-center text-sm text-sage">No jobs linked to this contract yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}