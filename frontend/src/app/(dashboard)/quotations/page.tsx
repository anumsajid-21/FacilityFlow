"use client";
import { useEffect, useState } from "react";
import { Quote, Check, X } from "lucide-react";
import { quotationsApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Loading, StatusBadge } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { money, dateShort, humanize } from "@/lib/utils";
import { useConfirm } from "@/components/ui/kit";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const load = () => quotationsApi.list().then((p) => setQuotations(p.data)).catch(() => setQuotations([]));
  useEffect(() => { load(); }, []);

  // group by service request for side-by-side comparison
  const groups = (quotations ?? []).reduce<Record<string, any[]>>((acc, q) => {
    const id = q.serviceRequestId || "open";
    (acc[id] = acc[id] || []).push(q);
    return acc;
  }, {});
  const all = Object.entries(groups).sort((a, b) => (b[1][0].createdAt || "").localeCompare(a[1][0].createdAt || ""));

  const accept = async (id: string) => {
    const ok = await confirm("Accept this quotation?", "Accepting will select this provider and reject competing quotations.", { confirmLabel: "Accept" });
    if (!ok) return;
    setBusy(id);
    try { await quotationsApi.accept(id); toast.success("Quotation accepted", "Provider selected."); load(); }
    catch (e: any) { toast.error("Failed", e?.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" subtitle="Compare provider proposals and select a partner" />

      {!quotations ? <Loading /> : all.length === 0 ? (
        <Card><EmptyState icon={<Quote className="h-6 w-6" />} title="No quotations" description="Provider proposals will appear here for comparison." /></Card>
      ) : (
        <div className="space-y-6">
          {all.map(([reqId, list]) => (
            <div key={reqId}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-charcoal">{list[0]?.serviceRequest?.title || "Service request"}</h3>
                <span className="text-xs text-sage">Request: {reqId.slice(0, 8)}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {list.map((q) => (
                  <Card key={q.id} className={`flex flex-col p-5 ${q.status === "ACCEPTED" ? "border-pine ring-1 ring-pine/30" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass-soft font-bold text-[#7A5E2E]">{q.provider?.name?.slice(0, 1).toUpperCase()}</div>
                      <StatusBadge status={q.status} />
                    </div>
                    <h4 className="mt-3 font-semibold text-charcoal">{q.provider?.name || "Provider"}</h4>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-charcoal">{money(q.price)}</span>
                      {q.duration && <span className="text-sm text-sage">/ {q.duration}</span>}
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      {q.numberOfWorkers ? <div className="flex justify-between"><dt className="text-sage">Workers</dt><dd className="font-medium text-charcoal">{q.numberOfWorkers}</dd></div> : null}
                      {q.duration ? <div className="flex justify-between"><dt className="text-sage">Duration</dt><dd className="font-medium text-charcoal">{q.duration}</dd></div> : null}
                      {q.sla ? <div className="flex justify-between"><dt className="text-sage">SLA</dt><dd className="font-medium text-charcoal">{q.sla}</dd></div> : null}
                      {q.expiryDate ? <div className="flex justify-between"><dt className="text-sage">Expires</dt><dd className="font-medium text-charcoal">{dateShort(q.expiryDate)}</dd></div> : null}
                    </dl>
                    {q.terms && <p className="mt-3 line-clamp-2 text-xs text-sage">{q.terms}</p>}
                    <div className="mt-4 flex gap-2 border-t border-border pt-3">
                      <Button size="sm" className="flex-1" disabled={q.status === "ACCEPTED"} loading={busy === q.id} onClick={() => accept(q.id)}>
                        {q.status === "ACCEPTED" ? <>Selected <Check className="h-4 w-4" /></> : "Accept quotation"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}