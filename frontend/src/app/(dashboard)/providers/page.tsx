"use client";
import { useEffect, useState } from "react";
import { Users, MapPin, BadgeCheck, Briefcase, Star } from "lucide-react";
import { providersApi, reviewsApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Loading, StatusBadge, Modal } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { humanize } from "@/lib/utils";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  const load = () => providersApi.list({ limit: 50 }).then((p) => setProviders(p.data)).catch(() => setProviders([]));
  useEffect(() => { load(); }, []);

  const open = async (p: any) => {
    setSelected(p); setReviews([]);
    try { const r = await reviewsApi.byProvider(p.id); setReviews(Array.isArray(r) ? r : (r?.items ?? [])); } catch { setReviews([]); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Providers" subtitle="Vetted service providers in your network" />

      {!providers ? <Loading /> : providers.length === 0 ? (
        <Card><EmptyState icon={<Users className="h-6 w-6" />} title="No providers yet" description="Providers in your area will appear here once they're verified." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="flex flex-col p-5 transition-all hover:border-brass hover:shadow-raised">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pine/10 text-lg font-bold text-pine">{p.name?.slice(0, 1).toUpperCase()}</div>
                {p.verificationStatus === "VERIFIED" && <span className="flex items-center gap-1 rounded-full bg-pine/10 px-2 py-0.5 text-xs font-medium text-pine"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
                {p.verificationStatus !== "VERIFIED" && <StatusBadge status={p.verificationStatus} />}
              </div>
              <h3 className="mt-3 font-semibold text-charcoal">{p.name}</h3>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-sage">{p.description}</p>}
              <div className="mt-4 space-y-1.5 text-xs text-sage">
                {p.serviceAreaText && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.serviceAreaText}</span>}
                {p.experience && <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {p.experience}</span>}
                {p.workforceCapacity ? <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Up to {p.workforceCapacity} workers</span> : null}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                {p.services?.length ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-sage">{p.services[0].category?.name || "Service"}{p.services.length > 1 ? ` +${p.services.length - 1}` : ""}</span> : null}
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => open(p)}>{p._count?.services ?? 0} services · View</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? "Provider"}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.verificationStatus} />
              {selected.workforceCapacity && <span className="text-xs text-sage">{selected.workforceCapacity} worker capacity</span>}
            </div>
            {selected.description && <p className="text-sm text-sage">{selected.description}</p>}
            {selected.operatingInfo && <p className="text-sm text-sage"><span className="font-medium text-charcoal">Operating info:</span> {selected.operatingInfo}</p>}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-sage">Services</p>
              <div className="flex flex-wrap gap-2">
                {selected.services?.length ? selected.services.map((s: any) => (
                  <span key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-charcoal">{s.category?.name || "Service"}</span>
                )) : <span className="text-sm text-sage">No services listed.</span>}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-sage"><Star className="h-3.5 w-3.5" /> Reviews ({reviews.length})</p>
              <div className="space-y-2">
                {reviews.length === 0 ? <p className="text-sm text-sage">No reviews yet.</p> : reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-charcoal"><Star className="h-3.5 w-3.5 text-brass" /> {r.overallRating ?? "—"} / 5</p>
                    {r.comments && <p className="mt-1 text-sm text-sage">{r.comments}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}