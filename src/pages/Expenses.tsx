import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PageHeader,
  Card,
  PrimaryButton,
  Input,
  Select,
  Modal,
  EmptyState,
} from "../components/ui";
import { Receipt, Plus, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Receipt as ReceiptModal } from "../components/Receipt";

const categories = [
  "رواتب",
  "إيجار",
  "مستلزمات",
  "طعام",
  "صيانة",
  "كهرباء وماء",
  "أخرى",
];

export function Expenses() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const expenses =
    useQuery(api.expenses.listByMonth, {
      month: selectedMonth,
    }) || [];
  const receipts = useQuery(api.receipts.list) || [];
  const addExpense = useMutation(api.expenses.add);
  const removeExpense = useMutation(api.expenses.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    category: "مستلزمات",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) {
      toast.error("يرجى إدخال عنوان المصروف");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    try {
      const result = await addExpense({
        title: form.title.trim(),
        category: form.category,
        amount,
        date: form.date,
        notes: form.notes.trim() || undefined,
      });
      toast.success("تم تسجيل المصروف");
      setModalOpen(false);
      setForm({
        title: "",
        category: "مستلزمات",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      // عرض الإيصال الموحد بعد التسجيل
      const newReceipt = receipts.find(
        (r) => r.receiptNumber === result.receiptNumber,
      );
      if (newReceipt) setSelectedReceipt(newReceipt);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ",
      );
    }
  };

  const onDelete = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا المصروف؟")) return;
    try {
      await removeExpense({ id });
      toast.success("تم حذف المصروف");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div>

        <PageHeader
          title="المصروفات"
          subtitle={`إجمالي المصروفات: ${total.toLocaleString()} ج.م`}
          action={
            <PrimaryButton onClick={() => setModalOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> تسجيل مصروف
              </span>
            </PrimaryButton>
          }
        />

      <div className="mb-4 flex justify-end">
        <Select
          label=""
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </Select>
      </div>



      {expenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="لا توجد مصروفات بعد"
            subtitle="سجل مصروفات الأكاديمية لتتبع النفقات"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp, i) => (
            <motion.div
              key={exp._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{exp.title}</h3>
                      <p className="text-xs text-slate-500">
                        {exp.category} — {exp.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-600">
                      {exp.amount.toLocaleString()} ج.م
                    </span>
                    {exp.receiptNumber && (
                      <button
                        onClick={() => {
                          const r = receipts.find(
                            (x) => x.receiptNumber === exp.receiptNumber,
                          );
                          if (r) setSelectedReceipt(r);
                        }}
                        className="p-2 rounded-lg hover:bg-violet-50 text-violet-600"
                        title="عرض الإيصال"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(exp._id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {exp.notes && (
                  <p className="mt-2 text-sm text-slate-500">{exp.notes}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل مصروف جديد"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="إسم المنتج أو الخدمة"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Select
            label="الفئة"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            label="المبلغ (ج.م)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label="التاريخ"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit">تسجيل</PrimaryButton>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
