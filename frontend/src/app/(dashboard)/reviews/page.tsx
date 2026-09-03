"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { reviewsApi, providersApi, jobsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader, EmptyState, Loading, Field, Input, Textarea } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { dateShort } from "@/lib/utils";

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const isProvider = user?.role === "PROVIDER";
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[] | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [form, setForm] = useState({ jobId: "", providerId: "", quality: 5, timeliness: 5, professionalism: 5, value: 5, overallRating: 5, comments: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isProvider && user?.providerId) {
      reviewsApi.byProvider(user.providerId).then(setReviews).catch(() => setReviews([]));
    } else {
      providersApi.list().then((p) => setProvidersForForm(p.data)).catch(() => {});
      jobsApi.list().then((p) => setJobs(p.data.filter((j: any) => j.status === "COMPLETED"))).catch(() => setJobs([]));
      setReviews([]);
    }
  }, [isProvider, user]);

  const setProvidersForForm = (list: any[]) => { setForm((f) => ({ ...f, providerId: f.providerId || list[0]?.id || "" })); };

  const avg = reviews && reviews.length ? (reviews.reduce((s, r) => s + Number(r.overallRating ?? 0), 0) / reviews.length).toFixed(1) : null;

  const submit = async () => {
    if (!form.jobId) return toast.error("Required", "Select a completed job to review.");
    setBusy(true);
    try {
      await reviewsApi.create({ jobId: form.jobId, providerId: form.providerId, quality: Number(form.quality), timeliness: Number(form.timeliness), professionalism: Number(form.professionalism), value: Number(form.value), overallRating: Number(form.overallRating), comments: form.comments });
      toast.success("Review submitted"); setForm({ ...form, jobId: "", comments: "" });
    } catch (e: any) { toast.error("Failed", e?.message); } finally { setBusy(false); }
  };

  if (isProvider) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reviews" subtitle="How clients rate your work" />
        {!reviews ? <Loading /> : reviews.length === 0 ? (
          <Card><EmptyState icon={<Star className="h-6 w-6" />} title="No reviews yet" description="Reviews from completed jobs will appear here." /></Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4"><p className="text-xs text-sage">Average rating</p><p className="mt-1 text-2xl font-bold text-charcoal">{avg ? `${avg} ★` : "—"}</p></Card>
              <Card className="p-4"><p className="text-xs text-sage">Total reviews</p><p className="mt-1 text-2xl font-bold text-charcoal">{reviews.length}</p></Card>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <p className="flex items-center gap-1 text-sm font-semibold text-charcoal"><Star className="h-4 w-4 text-brass" /> {r.overallRating ?? "—"} / 5</p>
                  {r.comments && <p className="mt-2 text-sm text-sage">{r.comments}</p>}
                  <p className="mt-2 text-xs text-sage">{dateShort(r.createdAt)}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Rate providers after job completion" />
      <Card className="max-w-2xl">
        <div className="border-b border-border px-5 py-4"><h3 className="font-semibold text-charcoal">Submit a review</h3></div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Completed job"><select className="h-10 w-full rounded-lg border border-input bg-ivory px-3 text-sm" value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
              <option value="">Select…</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title || j.serviceName || "Job"}</option>)}
            </select></Field>
            <Field label="Provider"><Input value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} placeholder="provider id" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["quality", "timeliness", "professionalism", "value"] as const).map((k) => (
              <Field key={k} label={k}><Input type="number" min={1} max={5} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></Field>
            ))}
          </div>
          <Field label="Comments"><Textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} placeholder="Overall experience" /></Field>
          <div className="flex justify-end"><Button onClick={submit} loading={busy}>Submit review</Button></div>
        </div>
      </Card>
    </div>
  );
}