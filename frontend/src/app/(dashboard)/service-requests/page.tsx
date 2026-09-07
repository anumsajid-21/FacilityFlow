"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, AlertCircle } from "lucide-react";
import { serviceRequestsApi, facilitiesApi, apiError } from "@/services/api";
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
  const [floors, setFloors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", categoryId: "", buildingId: "", floorId: "", areaId: "", priority: "NORMAL", budget: "", preferredDate: "" });

  const load = () => serviceRequestsApi.list().then((p) => setItems(p.data)).catch(() => setItems([]));
  useEffect(() => {
    load();
    facilitiesApi.buildings().then((p) => {
      setBuildings(p.data);
    }).catch((err) => {
      console.error("Failed to load buildings:", err);
      setBuildings([]);
    });
  }, []);

  useEffect(() => {
    if (form.buildingId) {
      facilitiesApi.floors(form.buildingId).then(setFloors).catch(() => setFloors([]));
    } else {
      setFloors([]);
    }
    setForm((f) => ({ ...f, floorId: "", areaId: "" }));
  }, [form.buildingId]);

  useEffect(() => {
    if (form.floorId) {
      facilitiesApi.areas(form.floorId).then(setAreas).catch(() => setAreas([]));
    } else {
      setAreas([]);
    }
    setForm((f) => ({ ...f, areaId: "" }));
  }, [form.floorId]);

  const filtered = (items ?? []).filter((r) => {
    const matchesTab = tab === "all" ? true : r.status === tab;
    const q = search.toLowerCase();
    const matchesSearch = !q || (r.title || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });
  const countFor = (k: string) => k === "all" ? (items ?? []).length : (items ?? []).filter((r) => r.status === k).length;

  const create = async () => {
    setError("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.buildingId) {
      setError("Please select a building.");
      return;
    }
    setBusy(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        buildingId: form.buildingId,
        priority: form.priority,
        categoryId: form.categoryId || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        preferredDate: form.preferredDate || undefined,
        floorId: form.floorId || undefined,
        areaId: form.areaId || undefined,
      };
      const result = await serviceRequestsApi.create(payload);
      if (result) {
        // Publish immediately so the request is live, appears under "Open" and counts on the dashboard.
        try { await serviceRequestsApi.submit(result.id); } catch { /* stays as draft if submit fails */ }
        toast.success("Request created", "Your service request is now open for quotations.");
        setOpenCreate(false);
        setForm({ title: "", description: "", categoryId: "", buildingId: "", floorId: "", areaId: "", priority: "NORMAL", budget: "", preferredDate: "" });
        setFloors([]);
        setAreas([]);
        load();
      }
    } catch (e: any) {
      console.error("Create request failed:", e);
      const msg = apiError(e);
      setError(msg);
      toast.error("Failed", msg);
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", categoryId: "", buildingId: "", floorId: "", areaId: "", priority: "NORMAL", budget: "", preferredDate: "" });
    setFloors([]);
    setAreas([]);
    setError("");
    setOpenCreate(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Service Requests" subtitle="Create, track and compare requests" actions={<Button onClick={() => { setOpenCreate(true); setError(""); }}><Plus className="h-4 w-4" /> Create request</Button>} />
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
                <td className="px-4 py-3 text-sm text-sage">{r.building?.name ?? ""}</td>
                <td className="px-4 py-3 text-sm font-medium text-charcoal">{r.budget ? money(r.budget) : ""}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-sage">{dateShort(r.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      )}
      <Modal open={openCreate} onClose={resetForm} title="Create service request">
        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="HVAC repair" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what is needed" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Building">
              <Select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>
                <option value="">Select building</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Floor">
              <Select value={form.floorId} onChange={(e) => setForm({ ...form, floorId: e.target.value })} disabled={!form.buildingId}>
                <option value="">Select floor</option>
                {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Area">
              <Select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} disabled={!form.floorId}>
                <option value="">Select area</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></Select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="1500" /></Field>
            <Field label="Preferred date"><Input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit" loading={busy}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}