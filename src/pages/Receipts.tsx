import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PageHeader,
  Card,
  EmptyState,
} from "../components/ui";
import {
  Receipt as ReceiptIcon,
  Printer,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { Receipt } from "../components/Receipt";

export function Receipts() {
  const receipts = useQuery(api.receipts.list) || [];
  const children = useQuery(api.children.list) || [];

  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");

  const filtered = receipts.filter((r) => {
    if (!search.trim()) return true;

    const child = children.find(
      (c) => c._id === r.childId
    );

    const q = search.trim().toLowerCase();

    return (
      r.receiptNumber.toLowerCase().includes(q) ||
      (child?.name || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q)
    );
  });

  const typeLabel = (type: string) => {
    if (type === "expense") return "مصروف";
    if (type === "fee") return "رسوم";
    return "دفعة";
  };

  const typeColor = (type: string) => {
    if (type === "expense") {
      return "bg-amber-100 text-amber-700";
    }

    if (type === "fee") {
      return "bg-sky-100 text-sky-700";
    }

    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div>
      <PageHeader
        title="سجل الإيصالات"
        subtitle={`إجمالي الإيصالات: ${receipts.length}`}
      />

      <div className="mb-4 relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الإيصال أو اسم الطفل..."
          className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ReceiptIcon}
            title="لا توجد إيصالات بعد"
            subtitle="ستظهر الإيصالات تلقائيًا عند تسجيل الدفعات والمصروفات"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const child = children.find(
              (c) => c._id === r.childId
            );

            const amount = Number(r.amount || 0);
            const paid = Number(r.paid || 0);
            const remaining = Number(r.remaining || 0);

            return (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* بيانات الإيصال */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                        <ReceiptIcon className="w-5 h-5 text-violet-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          {r.receiptNumber}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {child?.name || "—"} —{" "}
                          {r.description || "—"}
                        </p>
                      </div>
                    </div>

                    {/* البيانات المالية */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor(
                          r.type
                        )}`}
                      >
                        {typeLabel(r.type)}
                      </span>

                      <div className="text-center">
                        <p className="text-[11px] text-slate-400">
                          المبلغ
                        </p>

                        <p className="font-bold text-slate-800">
                          {amount.toLocaleString()} ج.م
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-[11px] text-slate-400">
                          المدفوع
                        </p>

                        <p className="font-bold text-emerald-600">
                          {paid.toLocaleString()} ج.م
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-[11px] text-slate-400">
                          المتبقي
                        </p>

                        <p
                          className={`font-bold ${remaining > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                            }`}
                        >
                          {remaining.toLocaleString()} ج.م
                        </p>
                      </div>

                      <button
                        onClick={() => setSelected(r)}
                        className="p-2 rounded-lg hover:bg-violet-50 text-violet-600"
                        title="عرض وطباعة الإيصال"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {selected && (
        <Receipt
          receipt={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}