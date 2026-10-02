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
  Badge,
  EmptyState,
} from "../components/ui";
import {
  Wallet,
  Plus,
  Trash2,
  CreditCard,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Receipt } from "../components/Receipt";

const FEE_TYPES = ["رسوم شهرية"];

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const date = new Date();

  date.setDate(1);
  date.setMonth(date.getMonth() - i);

  return {
    value: date.toISOString().slice(0, 7),
    label: date.toLocaleDateString("ar-EG", {
      month: "long",
      year: "numeric",
    }),
  };
});

export function Fees() {
  const children = useQuery(api.children.list) || [];

  const payments = useQuery(api.payments.list) || [];

  const receipts = useQuery(api.receipts.list) || [];

  const createFee = useMutation(api.fees.createFee);

  const addPayment = useMutation(api.payments.add);

  const removePayment = useMutation(api.payments.remove);

  const removeFee = useMutation(api.fees.remove);

  const [feeModal, setFeeModal] = useState(false);

  const [payModal, setPayModal] = useState(false);

  const [selectedFee, setSelectedFee] = useState<any>(null);

  const [receiptPayment, setReceiptPayment] = useState<any>(null);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const fees =
    useQuery(api.fees.listByMonth, {
      month: selectedMonth,
    }) || [];

  const [feeForm, setFeeForm] = useState({
    childId: "",
    feeType: "رسوم شهرية",
    month: new Date().toISOString().slice(0, 7),
    amount: "",
    discount: "",
  });

  const [payForm, setPayForm] = useState({
    amount: "",
    method: "نقدي",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const onCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feeForm.childId) {
      toast.error("يرجى اختيار الطفل");
      return;
    }

    const amount = Number(feeForm.amount);

    if (amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    try {
      await createFee({
        childId: feeForm.childId as any,
        feeType: feeForm.feeType,
        month: feeForm.month,
        amount,
        discount: Number(feeForm.discount) || 0,
      });

      toast.success("تم إنشاء الرسوم بنجاح");

      setFeeModal(false);

      setFeeForm({
        childId: "",
        feeType: "رسوم شهرية",
        month: new Date().toISOString().slice(0, 7),
        amount: "",
        discount: "",
      });
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const openPay = (fee: any) => {
    setSelectedFee(fee);

    const remaining =
      fee.amount -
      (fee.discount || 0) -
      fee.paid;

    setPayForm({
      amount: String(Math.max(0, remaining)),
      method: "نقدي",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });

    setPayModal(true);
  };

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFee) return;

    const amount = Number(payForm.amount);

    if (amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    const remaining =
      selectedFee.amount -
      (selectedFee.discount || 0) -
      selectedFee.paid;

    if (amount > remaining) {
      toast.error("المبلغ أكبر من المتبقي");
      return;
    }

    try {
      await addPayment({
        childId: selectedFee.childId,
        feeId: selectedFee._id,
        amount,
        date: payForm.date,
        method: payForm.method,
        notes: payForm.notes,
      });

      toast.success("تم تسجيل الدفعة بنجاح");

      // إغلاق نافذة تسجيل الدفعة فقط.
      // الإيصال يتم حفظه في قاعدة البيانات،
      // ولا يتم فتحه تلقائيًا.
      setPayModal(false);

      // تنظيف الدفعة المحددة بعد إتمام العملية.
      setSelectedFee(null);

      setPayForm({
        amount: "",
        method: "نقدي",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تسجيل الدفعة"
      );
    }
  };

  const onDeletePayment = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟")) {
      return;
    }

    try {
      await removePayment({ id });

      toast.success("تم حذف الدفعة");

      // لو كان الإيصال المعروض هو إيصال الدفعة المحذوفة،
      // يتم إغلاقه.
      setReceiptPayment(null);
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const onDeleteFee = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسوم؟")) {
      return;
    }

    try {
      await removeFee({ id });

      toast.success("تم حذف الرسوم");
    } catch (err: any) {
      console.error("Delete Fee Error:", err);

      toast.error(
        err?.message || "حدث خطأ أثناء حذف الرسوم"
      );
    }
  };

  const totalOutstanding = fees.reduce(
    (s, f) =>
      s +
      (f.amount -
        (f.discount || 0) -
        f.paid),
    0
  );

  return (
    <div>
      <PageHeader
        title="الرسوم والمدفوعات"
        subtitle={`إجمالي المتبقي: ${totalOutstanding.toLocaleString()} ج.م`}
        action={
          <PrimaryButton
            onClick={() => setFeeModal(true)}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إنشاء رسوم
            </span>
          </PrimaryButton>
        }
      />

      {/* اختيار الشهر */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            عرض رسوم شهر
          </p>
        </div>

        <Select
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(e.target.value)
          }
        >
          {monthOptions.map((month) => (
            <option
              key={month.value}
              value={month.value}
            >
              {month.label}
            </option>
          ))}
        </Select>
      </div>

      {fees.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="لا توجد رسوم بعد"
            subtitle="أنشئ رسوماً للأطفال لتتبع المدفوعات"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {fees.map((fee, i) => {
            const child = children.find(
              (c) => c._id === fee.childId
            );

            const discount = fee.discount || 0;

            const remaining =
              fee.amount -
              discount -
              fee.paid;

            const feePayments = payments.filter(
              (p) => p.feeId === fee._id
            );

            return (
              <motion.div
                key={fee._id}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: i * 0.04,
                }}
              >
                <Card className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-violet-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          {child?.name || "طفل"}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {fee.feeType || "رسوم شهرية"} —{" "}
                          {fee.month} —{" "}
                          {child?.className}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          المبلغ
                        </p>

                        <p className="font-bold text-slate-800">
                          {fee.amount.toLocaleString()} ج.م
                        </p>
                      </div>

                      {discount > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-slate-500">
                            الخصم
                          </p>

                          <p className="font-bold text-amber-600">
                            -{discount.toLocaleString()} ج.م
                          </p>
                        </div>
                      )}

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          المدفوع
                        </p>

                        <p className="font-bold text-emerald-600">
                          {fee.paid.toLocaleString()} ج.م
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          المتبقي
                        </p>

                        <p className="font-bold text-rose-600">
                          {remaining.toLocaleString()} ج.م
                        </p>
                      </div>

                      <Badge status={fee.status} />

                      <div className="flex items-center gap-2">
                        <PrimaryButton
                          onClick={() =>
                            openPay(fee)
                          }
                        >
                          <span className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            تسجيل دفعة
                          </span>
                        </PrimaryButton>

                        <button
                          type="button"
                          onClick={() =>
                            onDeleteFee(fee._id)
                          }
                          className="p-2.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
                          title="حذف الرسوم"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* شريط التقدم */}
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (fee.paid /
                              (fee.amount -
                                discount)) *
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* سجل الدفعات */}
                  {feePayments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        سجل الدفعات
                      </p>

                      <div className="space-y-2">
                        {feePayments.map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">
                                {p.amount.toLocaleString()} ج.م
                              </span>

                              <span className="text-xs text-slate-400">
                                {p.method} — {p.date}
                              </span>

                              {p.receiptNumber && (
                                <span className="text-xs text-violet-600 font-semibold">
                                  {p.receiptNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* فتح الإيصال يدويًا فقط */}
                              <button
                                onClick={() => {
                                  const r =
                                    receipts.find(
                                      (x) =>
                                        x.receiptNumber ===
                                        p.receiptNumber
                                    );

                                  if (r) {
                                    setReceiptPayment(r);
                                  } else {
                                    toast.error(
                                      "لم يتم العثور على الإيصال"
                                    );
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600"
                                title="عرض الإيصال"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  onDeletePayment(
                                    p._id
                                  )
                                }
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                                title="حذف الدفعة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* نافذة إنشاء الرسوم */}
      <Modal
        open={feeModal}
        onClose={() =>
          setFeeModal(false)
        }
        title="إنشاء رسوم"
      >
        <form
          onSubmit={onCreateFee}
          className="space-y-4"
        >
          <Select
            label="الطفل"
            value={feeForm.childId}
            onChange={(e) =>
              setFeeForm({
                ...feeForm,
                childId: e.target.value,
              })
            }
            required
          >
            <option value="">
              اختر الطفل
            </option>

            {children.map((c) => (
              <option
                key={c._id}
                value={c._id}
              >
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            label="نوع الرسوم"
            value={feeForm.feeType}
            onChange={(e) =>
              setFeeForm({
                ...feeForm,
                feeType: e.target.value,
              })
            }
          >
            {FEE_TYPES.map((t) => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))}
          </Select>

          <Input
            label="الشهر / الفترة"
            type="month"
            value={feeForm.month}
            onChange={(e) =>
              setFeeForm({
                ...feeForm,
                month: e.target.value,
              })
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="المبلغ (ج.م)"
              type="number"
              value={feeForm.amount}
              onChange={(e) =>
                setFeeForm({
                  ...feeForm,
                  amount: e.target.value,
                })
              }
              required
            />

            <Input
              label="الخصم (ج.م)"
              type="number"
              value={feeForm.discount}
              onChange={(e) =>
                setFeeForm({
                  ...feeForm,
                  discount: e.target.value,
                })
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit">
              إنشاء
            </PrimaryButton>

            <button
              type="button"
              onClick={() =>
                setFeeModal(false)
              }
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* نافذة تسجيل دفعة */}
      <Modal
        open={payModal}
        onClose={() =>
          setPayModal(false)
        }
        title="تسجيل دفعة"
      >
        {selectedFee && (
          <form
            onSubmit={onPay}
            className="space-y-4"
          >
            <div className="bg-violet-50 rounded-xl p-4 text-sm">
              <p className="font-bold text-slate-800">
                {
                  children.find(
                    (c) =>
                      c._id ===
                      selectedFee.childId
                  )?.name
                }
              </p>

              <p className="text-slate-600 mt-1">
                المتبقي:{" "}
                <span className="font-bold text-rose-600">
                  {(
                    selectedFee.amount -
                    (selectedFee.discount || 0) -
                    selectedFee.paid
                  ).toLocaleString()}{" "}
                  ج.م
                </span>
              </p>
            </div>

            <Input
              label="مبلغ الدفعة (ج.م)"
              type="number"
              value={payForm.amount}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  amount: e.target.value,
                })
              }
              required
            />

            <Select
              label="طريقة الدفع"
              value={payForm.method}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  method: e.target.value,
                })
              }
            >
              <option value="نقدي">
                نقدي
              </option>

              <option value="بطاقة">
                بطاقة
              </option>

              <option value="تحويل">
                تحويل بنكي
              </option>
            </Select>

            <Input
              label="تاريخ الدفع"
              type="date"
              value={payForm.date}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  date: e.target.value,
                })
              }
              required
            />

            <Input
              label="ملاحظات"
              value={payForm.notes}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  notes: e.target.value,
                })
              }
            />

            <div className="flex gap-3 pt-2">
              <PrimaryButton type="submit">
                تسجيل الدفعة
              </PrimaryButton>

              <button
                type="button"
                onClick={() =>
                  setPayModal(false)
                }
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* الإيصال لا يظهر تلقائيًا.
          يظهر فقط عند الضغط على زر الطباعة. */}
      {receiptPayment && (
        <Receipt
          receipt={receiptPayment}
          onClose={() =>
            setReceiptPayment(null)
          }
        />
      )}
    </div>
  );
}