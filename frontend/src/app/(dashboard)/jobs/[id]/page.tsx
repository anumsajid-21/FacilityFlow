"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HardHat, Camera, Check, RotateCcw, Building2, Calendar, Clock } from "lucide-react";
import { jobsApi, proofApi, approvalsApi, filesApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader, Loading, StatusBadge, Field, Textarea } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { money, dateShort } from "@/lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [job, setJob] = useState<any | null>(null);
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState("");
  const [reworkReason, setReworkReason] = useState("");
  const [beforeIds, setBeforeIds] = useState<string[]>([]);
  const [afterIds, setAfterIds] = useState<string[]>([]);

  const load = () => jobsApi.get(id).then(setJob).catch(() => setJob(null));
  useEffect(() => { load(); }, [id]);

  const isProvider = user?.role === "PROVIDER";
  const isHiring = user?.role === "HIRING_ORG" || user?.role === "ADMIN";
  const canStart = isProvider && ["SCHEDULED", "ASSIGNED"].includes(job?.status);

  const act = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    try { await fn(); toast.success("Done"); load(); } catch (e: any) { toast.error("Failed", e?.message); } finally { setBusy(""); }
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const r = await filesApi.upload(f, "JOB_PHOTO"); setter((p) => [...p, r.id]); toast.success("Photo uploaded"); } catch (ex: any) { toast.error("Upload failed", ex?.message); }
  };
  const submitProof = () => act("proof", () => proofApi.add(id, { providerNote: notes, workerName: "Assigned worker" }, beforeIds, afterIds));

  if (!job) return <Loading />;
return (
    <div className="space-y-6">
      <PageHeader title={job.title || job.serviceName || "Job"} subtitle={job.contract?.serviceName || "Contract job"} actions={<><StatusBadge status={job.status} /><Button variant="outline" onClick={() => router.back()}>Back</Button></>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <span className="flex items-center gap-2 text-sm text-sage"><Building2 className="h-4 w-4 text-pine" /> {job.contract?.building?.name || "Building"}</span>
              <span className="flex items-center gap-2 text-sm text-sage"><Calendar className="h-4 w-4 text-pine" /> {dateShort(job.date)}</span>
              <span className="flex items-center gap-2 text-sm text-sage"><Clock className="h-4 w-4 text-pine" /> {job.contract?.provider?.name || "Provider"}</span>
              {job.requiredSkills && <span className="flex items-center gap-2 text-sm text-sage"><HardHat className="h-4 w-4 text-pine" /> {job.requiredSkills}</span>}
            </div>
            {job.instructions && <p className="border-t border-border px-5 py-4 text-sm text-sage">{job.instructions}</p>}
          </Card>

          {isProvider && (
            <Card>
              <p className="border-b border-border px-5 py-3 text-sm font-semibold text-charcoal">Proof of work</p>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-sage">Before photos</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-sage hover:border-brass">
                    <Camera className="mb-2 h-5 w-5" /> Add before photo<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, setBeforeIds)} />
                  </label>
                  {beforeIds.length > 0 && <p className="mt-2 text-xs text-pine">{beforeIds.length} uploaded</p>}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-sage">After photos</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-sage hover:border-brass">
                    <Camera className="mb-2 h-5 w-5" /> Add after photo<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, setAfterIds)} />
                  </label>
                  {afterIds.length > 0 && <p className="mt-2 text-xs text-pine">{afterIds.length} uploaded</p>}
                </div>
              </div>
              <div className="flex items-end gap-3 border-t border-border p-5">
                <div className="flex-1"><Field label="Completion notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes about the work completed" /></Field></div>
                <Button onClick={submitProof} loading={busy === "proof"} disabled={!notes && beforeIds.length === 0 && afterIds.length === 0}>Submit proof</Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <p className="border-b border-border px-5 py-3 text-sm font-semibold text-charcoal">Actions</p>
            <div className="space-y-2 p-4">
              {canStart && <Button className="w-full" onClick={() => act("start", () => jobsApi.start(id))} loading={busy === "start"}><HardHat className="h-4 w-4" /> Start job</Button>}
              {isProvider && job.status === "IN_PROGRESS" && <Button className="w-full" variant="secondary" onClick={() => act("complete", () => jobsApi.complete(id))} loading={busy === "complete"}><Check className="h-4 w-4" /> Complete job</Button>}
              {isHiring && ["COMPLETED", "AWAITING_APPROVAL"].includes(job.status) && (
                <>
                  <Button className="w-full" variant="secondary" onClick={() => act("approve", () => approvalsApi.approve(id))} loading={busy === "approve"}><Check className="h-4 w-4" /> Approve job</Button>
                  <div className="space-y-2">
                    <Textarea value={reworkReason} onChange={(e) => setReworkReason(e.target.value)} placeholder="Reason for rework" />
                    <Button className="w-full" variant="outline" onClick={() => act("rework", () => approvalsApi.rework(id, reworkReason))} loading={busy === "rework"}><RotateCcw className="h-4 w-4" /> Request rework</Button>
                  </div>
                </>
              )}
              {!canStart && job.status === "SCHEDULED" && <p className="text-center text-xs text-sage">Awaiting provider to start.</p>}
            </div>
          </Card>
          {job.contract?.price && (
            <Card className="p-5">
              <p className="text-xs text-sage">Contract value</p>
              <p className="mt-1 text-2xl font-bold text-charcoal">{money(job.contract.price)}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}