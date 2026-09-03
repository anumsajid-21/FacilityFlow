"use client";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User } from "lucide-react";
import { orgApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader, Field, Input, Loading } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [org, setOrg] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === "HIRING_ORG") orgApi.me().then((o) => { setOrg(o); setName(o.name); }).catch(() => setOrg(undefined));
    else setOrg(undefined);
  }, [user]);

  const save = async () => {
    setBusy(true);
    try { await orgApi.update({ name }); toast.success("Organization updated"); } catch (e: any) { toast.error("Failed", e?.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and organization" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-border px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-charcoal"><SettingsIcon className="h-4 w-4 text-pine" /> Organization settings</h3></div>
          {user?.role === "HIRING_ORG" && org === null ? <Loading /> : (
            <div className="space-y-4 p-5">
              {user?.role === "HIRING_ORG" ? (
                <>
                  <Field label="Organization name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                  <div className="flex justify-end"><Button onClick={save} loading={busy}>Save changes</Button></div>
                </>
              ) : (
                <p className="text-sm text-sage">Organization settings are available for hiring organizations.</p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-4"><h3 className="flex items-center gap-2 font-semibold text-charcoal"><User className="h-4 w-4 text-pine" /> Account</h3></div>
          <div className="space-y-4 p-5">
            <Field label="Name"><Input value={user?.name ?? ""} readOnly /></Field>
            <Field label="Email"><Input value={user?.email ?? ""} readOnly /></Field>
            <Field label="Role"><Input value={user?.role ?? ""} readOnly className="uppercase" /></Field>
          </div>
        </Card>
      </div>
    </div>
  );
}