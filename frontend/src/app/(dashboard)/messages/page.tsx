"use client";
import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Search, ArrowLeft, ChevronRight } from "lucide-react";
import { messagingApi, apiError } from "@/services/api";
import { Card, EmptyState, Loading, PageHeader } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import { cn, timeAgo, timeShort } from "@/lib/utils";

export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const meId = useAuthStore((s) => s.user?.id);
  const [threads, setThreads] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => messagingApi.threads().then((r) => setThreads(r.threads ?? r)).catch(() => setThreads([]));
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selected]);

  const open = async (id: string) => {
    try {
      setSelected(await messagingApi.thread(id));
      setMobileChatOpen(true);
    } catch (e) { toast.error("Unable to open thread", apiError(e)); }
  };
  const send = async () => {
    if (!selected || !body.trim()) return;
    setBusy(true);
    try {
      const message = await messagingApi.send(selected.id, body);
      setSelected({ ...selected, messages: [...selected.messages, message] });
      setBody("");
      load();
    } catch (e) { toast.error("Message failed", apiError(e)); } finally { setBusy(false); }
  };

  const threadTitle = (t: any) => {
    if (role === "HIRING_ORG") return t.provider?.name ?? t.subject ?? "Conversation";
    if (role === "PROVIDER") return t.organization?.name ?? t.subject ?? "Conversation";
    return t.subject || t.provider?.name || t.organization?.name || "Conversation";
  };
  const lastMessage = (t: any) => {
    const msgs = t.messages ?? [];
    return msgs[msgs.length - 1];
  };
  const contextTag = (t: any) =>
    t.serviceRequest?.title ? `Request: ${t.serviceRequest.title}` :
    t.contract?.title ? `Contract: ${t.contract.title}` :
    t.quotation?.id ? "Quotation discussion" : null;

  const q = search.trim().toLowerCase();
  const filtered = (threads ?? []).filter((t) => {
    if (!q) return true;
    const last = lastMessage(t);
    const haystack = [t.subject, t.organization?.name, t.provider?.name, last?.body, contextTag(t)]
      .filter(Boolean).join(" ").toLowerCase();
    // match any word prefix (e.g. "prime" or "hvac" match "Prime HVAC Services")
    return q.split(/\s+/).filter(Boolean).some((w) => haystack.includes(w));
  });

  // autocomplete suggestions: matching contact names while typing
  const allNames = Array.from(new Set((threads ?? []).map((t) => threadTitle(t)).filter(Boolean)));
  const suggestions = q ? allNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 5) : [];


  const chatHeader = selected && (
    <div className="flex items-center gap-3 border-b border-border bg-ivory px-4 py-3">
      <button className="rounded-lg p-1.5 text-sage hover:bg-muted lg:hidden" onClick={() => setMobileChatOpen(false)} aria-label="Back to conversations">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-semibold text-ivory">
        {(threadTitle(selected) ?? "?").slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-charcoal">{threadTitle(selected)}</p>
        <p className="truncate text-xs text-sage">
          {selected.organization?.name ?? "—"} · {selected.provider?.name ?? "—"}
          {contextTag(selected) ? ` · ${contextTag(selected)}` : ""}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="One unified inbox for everything — requests, quotations, contracts and jobs." />
      {!threads ? <Loading /> : threads.length === 0 ? (
        <Card><EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No conversations yet" description={role === "HIRING_ORG" ? "Start a conversation from a provider or contract." : "Messages from hiring organizations will appear here."} /></Card>
      ) : (
        <div className={cn("grid gap-4 lg:grid-cols-[340px_1fr]", mobileChatOpen && "hidden lg:grid")}>
          {/* Thread list */}
          <Card className={cn("flex max-h-[70vh] min-h-[420px] flex-col overflow-hidden", mobileChatOpen ? "hidden lg:flex" : "")}>
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations"
                  className="h-10 w-full rounded-full border border-border bg-muted/50 pl-9 pr-3 text-sm text-charcoal outline-none placeholder:text-sage/70 focus:border-brass" />
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-10 overflow-hidden rounded-xl border border-border bg-ivory shadow-raised">
                    {suggestions.map((name) => (
                      <button key={name} type="button" onClick={() => setSearch(name)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-charcoal hover:bg-muted/60">
                        <MessageCircle className="h-3.5 w-3.5 text-pine" />
                        <span className="truncate">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-6 text-center text-sm text-sage">No conversations match “{search}”.</p>
              ) : filtered.map((t) => {
                const last = lastMessage(t);
                const unread = Number(t.unreadCount ?? 0);
                return (
                  <button key={t.id} onClick={() => open(t.id)}
                    className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60", selected?.id === t.id && "bg-muted")}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine/10 text-sm font-semibold text-pine">
                      {(threadTitle(t) ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-charcoal">{threadTitle(t)}</p>
                        {last?.createdAt && <span className="shrink-0 text-[11px] text-sage">{timeAgo(last.createdAt)}</span>}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={cn("truncate text-xs", unread > 0 ? "font-medium text-charcoal" : "text-sage")}>
                          {last ? `${last.senderId === meId ? "You: " : ""}${last.body}` : "No messages yet"}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pine px-1.5 text-[10px] font-semibold text-ivory">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                      {contextTag(t) && (
                        <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-brass-soft px-2 py-0.5 text-[10px] font-medium text-pine">{contextTag(t)}</p>
                      )}
                    </div>
                    <ChevronRight className="mt-3 hidden h-4 w-4 shrink-0 text-sage/50 sm:block" />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Chat view */}
          <Card className={cn("flex min-h-[420px] max-h-[70vh] flex-col overflow-hidden", !mobileChatOpen && "hidden lg:flex")}>
            {!selected ? (
              <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Select a conversation" description="Pick a thread from the inbox to see the full conversation." />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                {chatHeader}
                <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-sand/60 p-4">
                  {selected.messages?.map((m: any) => {
                    const mine = m.senderId === meId;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-card sm:max-w-[70%]",
                          mine ? "rounded-br-md bg-pine text-ivory" : "rounded-bl-md bg-ivory text-charcoal")}>
                          {!mine && <p className="mb-0.5 text-[11px] font-semibold text-pine">{m.sender?.name ?? "Other party"}</p>}
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={cn("mt-1 text-right text-[10px]", mine ? "text-ivory/60" : "text-sage")}>{timeShort(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {selected.messages?.length === 0 && <p className="py-8 text-center text-sm text-sage">No messages yet — say hello 👋</p>}
                </div>
                <div className="flex items-end gap-2 border-t border-border bg-ivory p-3">
                  <textarea value={body} onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Write a message…" rows={1}
                    className="max-h-32 min-h-10 flex-1 resize-y rounded-full border border-border bg-muted/50 px-4 py-2.5 text-sm text-charcoal outline-none placeholder:text-sage/70 focus:border-brass" />
                  <Button onClick={send} disabled={busy || !body.trim()} className="shrink-0 rounded-full px-4" aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
