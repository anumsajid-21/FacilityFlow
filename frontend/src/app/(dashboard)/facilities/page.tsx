"use client";
import { useEffect, useState } from "react";
import { Building2, Plus, MapPin, Layers, Trash2, CornerDownRight } from "lucide-react";
import { facilitiesApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Modal, Field, Input, Loading, useConfirm } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";

export default function FacilitiesPage() {
  const [buildings, setBuildings] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [areasByFloor, setAreasByFloor] = useState<Record<string, any[]>>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  const load = () => facilitiesApi.buildings().then((p) => setBuildings(p.data)).catch(() => setBuildings([]));
  useEffect(() => { load(); }, []);

  const selectBuilding = async (b: any) => {
    setSelected(b); setAreasByFloor({});
    try { setFloors((await facilitiesApi.building(b.id))?.floors ?? []); } catch { setFloors([]); }
  };
  const toggleAreas = async (floorId: string) => {
    if (areasByFloor[floorId]) { setAreasByFloor((m) => { const n = { ...m }; delete n[floorId]; return n; }); }
    else { try { const a = await facilitiesApi.areas(floorId); setAreasByFloor((m) => ({ ...m, [floorId]: a })); } catch { /* */ } }
  };
  const create = async () => {
    if (!form.name || !form.address || !form.city) return toast.error("Missing fields", "Name, address and city are required.");
    setBusy(true);
    try {
      await facilitiesApi.createBuilding(form);
      toast.success("Building created"); setOpenCreate(false); setForm({ name: "", address: "", city: "" }); load();
    } catch (e: any) { toast.error("Failed", e?.message || "Could not create building"); } finally { setBusy(false); }
  };
  const removeBuilding = async (id: string) => {
    if (!(await confirm("Delete this building?", "The building and its floors/areas will be removed from your facilities. This cannot be undone.", { confirmLabel: "Delete", danger: true }))) return;
    try { await facilitiesApi.deleteBuilding(id); toast.success("Building deleted"); if (selected?.id === id) setSelected(null); load(); } catch (e: any) { toast.error("Failed", e?.message); }
  };
  const addFloor = async () => {
    const name = window.prompt("Floor name"); if (!name || !selected) return;
    try { await facilitiesApi.createFloor(selected.id, name); toast.success("Floor added"); selectBuilding(selected); } catch (e: any) { toast.error("Failed", e?.message); }
  };
  const addArea = async (floorId: string) => {
    const name = window.prompt("Area name"); if (!name) return;
    try { await facilitiesApi.createArea(floorId, { name }); toast.success("Area added"); setAreasByFloor({}); if (selected) selectBuilding(selected); } catch (e: any) { toast.error("Failed", e?.message); }
  };
return (
    <div className="space-y-6">
      <PageHeader title="Facilities" subtitle="Buildings, floors and areas across your portfolio" actions={<Button onClick={() => setOpenCreate(true)}><Plus className="h-4 w-4" /> Add building</Button>} />

      {!buildings ? <Loading /> : buildings.length === 0 ? (
        <Card><EmptyState icon={<Building2 className="h-6 w-6" />} title="No buildings yet" description="Add your first building to start structuring your facilities." action={<Button onClick={() => setOpenCreate(true)}>Add building</Button>} /></Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {buildings.map((b) => (
              <Card key={b.id} className={`cursor-pointer transition-all ${selected?.id === b.id ? "border-pine ring-1 ring-pine/30" : "hover:border-brass"}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-pine/10 p-2.5 text-pine"><Building2 className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => selectBuilding(b)}>
                    <p className="truncate font-semibold text-charcoal">{b.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-sage"><MapPin className="h-3 w-3" /> {b.city}, {b.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.buildingType && <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-sage">{b.buildingType}</span>}
                    {b.numberOfFloors ? <span className="flex items-center gap-1 text-xs text-sage"><Layers className="h-3 w-3" /> {b.numberOfFloors}</span> : null}
                    <button onClick={() => removeBuilding(b.id)} className="rounded p-1 text-sage hover:bg-terracotta-soft hover:text-terracotta" title="Delete building"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            {!selected ? (
              <EmptyState icon={<Building2 className="h-6 w-6" />} title="Select a building" description="Choose a building to view its floors and areas." />
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div><h3 className="font-semibold text-charcoal">{selected.name}</h3><p className="text-xs text-sage">{selected.city}</p></div>
                  <Button variant="outline" size="sm" onClick={addFloor}><Plus className="h-4 w-4" /> Floor</Button>
                </div>
                <div className="space-y-2 p-4">
                  {floors.length === 0 ? <p className="py-8 text-center text-sm text-sage">No floors yet.</p> : floors.map((f) => {
                    const open = !!areasByFloor[f.id];
                    return (
                      <div key={f.id}>
                        <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                          <button onClick={() => toggleAreas(f.id)} type="button" className="flex flex-1 items-center gap-2 text-sm font-medium text-charcoal hover:text-pine">
                            <Layers className="h-4 w-4 text-pine" /> {f.name}
                          </button>
                          <button onClick={() => addArea(f.id)} className="rounded p-1 text-sage hover:bg-pine/10 hover:text-pine" title="Add area"><Plus className="h-4 w-4" /></button>
                        </div>
                        {open && <div className="mt-1 space-y-1 pl-5">{areasByFloor[f.id]?.length ? areasByFloor[f.id].map((a) => (
                          <div key={a.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-charcoal"><CornerDownRight className="h-3 w-3 text-brass" /> {a.name}</div>
                        )) : <p className="text-xs text-sage">No areas yet.</p>}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add building">
        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-4">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HQ Tower" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" required /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Austin" required /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button><Button type="submit" loading={busy}>Create building</Button></div>
        </form>
      </Modal>
      {confirmDialog}
    </div>
  );
}