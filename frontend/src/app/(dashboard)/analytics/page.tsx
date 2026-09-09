"use client";
import { useEffect, useState } from "react";
import { BarChart3, Download, Star } from "lucide-react";
import { analyticsApi } from "@/services/api";
import { Card, EmptyState, Loading, PageHeader } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("365");
  const getParams = () => ({ from: new Date(Date.now() - Number(range) * 864e5).toISOString(), to: new Date().toISOString() });
  const download = async () => { const response = await analyticsApi.exportCsv(getParams()); const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = "facilityflow-analytics.csv"; link.click(); URL.revokeObjectURL(url); };
  useEffect(() => { setData(null); analyticsApi.spend({ from: new Date(Date.now() - Number(range) * 864e5).toISOString(), to: new Date().toISOString() }).then(setData).catch(() => setData({ monthly: [], byCategory: [], byProvider: [], scorecards: [] })); }, [range]);
  if (!data) return <Loading />;
  const max = Math.max(1, ...(data.monthly ?? []).map((x: any) => x.amount));
  return <div className="space-y-6"><PageHeader title="Analytics" subtitle="Spend and provider performance across your facilities." actions={<><select value={range} onChange={(e) => setRange(e.target.value)} className="h-10 rounded-lg border border-input bg-ivory px-3 text-sm"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option></select><Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" /> Export CSV</Button></>} />
    <div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><h2 className="font-semibold text-charcoal">Spend over time</h2>{data.monthly?.length ? <div className="mt-5 flex h-48 items-end gap-2">{data.monthly.map((row: any) => <div key={row.period} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-terracotta" style={{ height: `${Math.max(4, row.amount / max * 160)}px` }} title={money(row.amount)} /><span className="text-[10px] text-sage">{row.period.slice(5)}</span></div>)}</div> : <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No invoice data yet" />}</Card>
      <Card className="p-5"><h2 className="font-semibold text-charcoal">Spend by category</h2><div className="mt-4 space-y-3">{data.byCategory?.map((row: any) => <div key={row.category}><div className="flex justify-between text-sm"><span className="text-charcoal">{row.category}</span><span className="font-medium text-pine">{money(row.amount)}</span></div><div className="mt-1 h-2 rounded bg-muted"><div className="h-full rounded bg-brass" style={{ width: `${Math.min(100, row.amount / max * 100)}%` }} /></div></div>)}</div></Card>
      <Card className="p-5"><h2 className="font-semibold text-charcoal">Spend by provider</h2><div className="mt-4 space-y-3">{data.byProvider?.map((row: any) => <div key={row.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="text-charcoal">{row.name}</span><span className="font-medium text-pine">{money(row.amount)}</span></div>)}</div></Card></div>
    <Card className="overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-semibold text-charcoal">Provider scorecards</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted text-xs uppercase text-sage"><tr><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Jobs</th><th className="px-5 py-3">Rework</th><th className="px-5 py-3">SLA breaches</th></tr></thead><tbody className="divide-y divide-border">{data.scorecards?.map((row: any) => <tr key={row.id}><td className="px-5 py-3 font-medium text-charcoal">{row.name}</td><td className="px-5 py-3 text-brass"><Star className="mr-1 inline h-4 w-4" />{row.averageRating.toFixed(1)}</td><td className="px-5 py-3 text-sage">{row.jobs}</td><td className="px-5 py-3 text-sage">{row.reworkRate}%</td><td className="px-5 py-3 text-sage">{row.slaBreaches}</td></tr>)}</tbody></table></div></Card>
  </div>;
}
