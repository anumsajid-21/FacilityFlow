"use client";
import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { messagingApi, apiError } from "@/services/api";
import { Card, EmptyState, Loading, PageHeader } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { useAuthStore } from "@/store/auth";

export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [threads, setThreads] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => messagingApi.threads().then((r) => setThreads(r.threads ?? r)).catch(() => setThreads([]));
  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, []);
  const open = async (id: string) => { try { setSelected(await messagingApi.thread(id)); } catch (e) { toast.error("Unable to open thread", apiError(e)); } };
  const send = async () => {
    if (!selected || !body.trim()) return;
    setBusy(true);
    try { const message = await messagingApi.send(selected.id, body); setSelected({ ...selected, messages: [...selected.messages, message] }); setBody(""); load(); }
    catch (e) { toast.error("Message failed", apiError(e)); } finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <PageHeader title="Messages" subtitle="Keep contract and service conversations in one place." />
    {!threads ? <Loading /> : threads.length === 0 ? <Card><EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No conversations yet" description={role === "HIRING_ORG" ? "Start a conversation from a provider or contract." : "Messages from hiring organizations will appear here."} /></Card> :
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="divide-y divide-border">{threads.map((thread) => <button key={thread.id} onClick={() => open(thread.id)} className={`w-full p-4 text-left hover:bg-muted ${selected?.id === thread.id ? "bg-muted" : ""}`}><p className="truncate font-medium text-charcoal">{thread.subject}</p><p className="mt-1 text-xs text-sage">{thread.organization?.name} · {thread.provider?.name}</p><p className="mt-2 line-clamp-1 text-xs text-sage">{thread.messages?.[0]?.body ?? "No messages"}</p></button>)}</Card>
        <Card className="flex min-h-[480px] flex-col">{!selected ? <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Select a conversation" /> : <><div className="border-b border-border p-5"><h2 className="font-semibold text-charcoal">{selected.subject}</h2><p className="text-xs text-sage">{selected.organization?.name} · {selected.provider?.name}</p></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{selected.messages?.map((message: any) => <div key={message.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${message.senderId === useAuthStore.getState().user?.id ? "ml-auto bg-pine text-ivory" : "bg-muted text-charcoal"}`}><p>{message.body}</p><p className="mt-1 text-[10px] opacity-70">{message.sender?.name}</p></div>)}</div><div className="flex gap-2 border-t border-border p-4"><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" rows={2} className="min-h-10 flex-1 rounded-lg border border-border bg-ivory px-3 py-2 text-sm outline-none focus:border-brass" /><Button onClick={send} disabled={busy || !body.trim()}><Send className="mr-1 h-4 w-4" /> Send</Button></div></>}</Card>
      </div>}
  </div>;
}
