"use client";
import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { invoicesApi } from "@/services/api";
import { Card, PageHeader, EmptyState, Loading, StatusBadge } from "@/components/ui/kit";
import { money, dateShort } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[] | null>(null);
  useEffect(() => { invoicesApi.list().then((p) => setInvoices(p.data)).catch(() => setInvoices([])); }, []);

  const totalOutstanding = (invoices ?? []).filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((s, i) => s + Number(i.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" subtitle="Billing across active contracts" />

      {invoices && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4"><p className="text-xs text-sage">Total billed</p><p className="mt-1 text-2xl font-bold text-charcoal">{money(invoices.reduce((s, i) => s + Number(i.total ?? 0), 0))}</p></Card>
          <Card className="p-4"><p className="text-xs text-sage">Outstanding</p><p className="mt-1 text-2xl font-bold text-terracotta">{money(totalOutstanding)}</p></Card>
          <Card className="p-4"><p className="text-xs text-sage">Invoice count</p><p className="mt-1 text-2xl font-bold text-charcoal">{invoices.length}</p></Card>
        </div>
      )}

      {!invoices ? <Loading /> : invoices.length === 0 ? (
        <Card><EmptyState icon={<ReceiptText className="h-6 w-6" />} title="No invoices" description="Invoices are generated for completed, approved jobs." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-sage">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-charcoal">{inv.invoiceNumber || inv.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold text-charcoal">{money(inv.total)}</td>
                    <td className="px-4 py-3 text-sm text-sage">{dateShort(inv.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-sm text-sage">{dateShort(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}