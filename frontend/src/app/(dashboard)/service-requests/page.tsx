"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { serviceRequestsApi, facilitiesApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Modal, Field, Input, Textarea, Select, Loading, Tabs, StatusBadge } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { dateShort, money } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "QUOTATIONS_RECEIVED", label: "Quotations" },
  { key: "PROVIDER_SELECTED", label: "Selected" },
  { key: "DRAFT", label: "Drafts" },
  { key: "CLOSED", label: "Closed" },
];

export default function ServiceRequestsPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [buildings, setBuildings] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", categoryId: "", buildingId: "", priority: "NORMAL", budget: "" });

  const load = () => serviceRequestsApi.list().then((p) => setItems(p.data)).catch(() => setItems([]));
  useEffect(() => { load(); facilitiesApi.buildings().then(setBuildings).catch(() => setBuildings([])); }, []);

  const filtered = (items ?? []).filter((r) => {
    const matchesTab = tab === "all" ? true : r.status === tab;
    const q = search.toLowerCase();
    const matchesSearch = !q || (r.title || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });
  const countFor = (k: string) => k === "all" ? (items ?? []).length : (items ?? []).filter((r) => r.status === k).length;

  const create = async () => {
    if (!form.title || !form.buildingId) return toast.error("Required", "Title and building are required.");
    setBusy(true);
    try {
      await serviceRequestsApi.create({ ...form, categoryId: form.categoryId || undefined, budget: form.budget ? Number(form.budget) : undefined });
      toast.success("Request created"); setOpenCreate(false); setForm({ title: "", description: "", categoryId: "", buildingId: "", priority: "NORMAL", budget: "" }); load();
    } catch (e: any) { toast.error("Failed", e?.message || "Could not create request"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Service Requests" subtitle="Create, track and compare requests" actions={<Button onClick={() => setOpenCreate(true)}><Plus className="h-4 w-4" /> Create request</Button>} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: countFor(t.key) }))} active={tab} onChange={setTab} />
        <div className="relative sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" /><Input className="pl-9" placeholder="Search requests" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>
      {!items ? <Loading /> : filtered.length === 0 ? (
        <Card><EmptyState icon={<FileText className="h-6 w-6" />} title="No service requests" description={items.length === 0 ? "Create your first request to get started." : "Nothing matches your filters."} action={items.length === 0 ? <Button onClick={() => setOpenCreate(true)}>Create request</Button> : undefined} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead className="bg-muted/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Request</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Building</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Budget</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Status</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Created</th></tr></thead>
            <tbody className="divide-y divide-border">{filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3"><Link href={`/service-requests/${r.id}`} className="text-sm font-medium text-charcoal hover:text-pine">{r.title || "Untitled request"}</Link><p className="max-w-xs truncate text-xs text-sage">{r.description}</p></td>
                <td className="px-4 py-3 text-sm text-sage">{r.building?.name || "\u2014"}</td>
                <td className="px-4 py-3 text-sm font-medium text-charcoal">{r.budget ? money(r.budget) : "\u2014"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-sage">{dateShort(r.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      )}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create service request">
        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-4">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="HVAC repair" required /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what is needed" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Building"><Select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })} required><option value="">Select</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
            <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></Select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Input value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} placeholder="id" /></Field>
            <Field label="Budget"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="1500" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button><Button type="submit" loading={busy}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
