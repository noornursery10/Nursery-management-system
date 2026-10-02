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
  Badge,
} from "../components/ui";
import {
  Baby,
  Plus,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function calcAge(birthDate: string): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 1) {
    return `${months} شهر`;
  }
  if (months === 0) return `${years} سنة`;
  return `${years} سنة و ${months} شهر`;
}

const emptyForm = {
  name: "",
  birthDate: "",
  gender: "ذكر",
  className: "",
  parentId: "",
  notes: "",
  image: "",
  enrollmentDate: "",
  teacherId: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
};

export function Children() {
  const children = useQuery(api.children.list) || [];
  const parents = useQuery(api.parents.list) || [];
  const staff = useQuery(api.staff.list) || [];
  const fees = useQuery(api.fees.list) || [];
  const payments = useQuery(api.payments.list) || [];
  const addChild = useMutation(api.children.add);
  const updateChild = useMutation(api.children.update);
  const removeChild = useMutation(api.children.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const resetForm = () => setForm({ ...emptyForm });

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (child: any) => {
    setEditing(child);
    setForm({
      name: child.name,
      birthDate: child.birthDate,
      gender: child.gender,
      className: child.className,
      parentId: child.parentId,
      notes: child.notes || "",
      image: child.image || "",
      enrollmentDate: child.enrollmentDate || "",
      teacherId: child.teacherId || "",
      address: child.address || "",
      emergencyName: child.emergencyName || "",
      emergencyPhone: child.emergencyPhone || "",
      emergencyRelation: child.emergencyRelation || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentId) {
      toast.error("يرجى اختيار ولي الأمر");
      return;
    }
    const payload = {
      ...form,
      parentId: form.parentId as any,
      teacherId: form.teacherId ? (form.teacherId as any) : undefined,
      image: form.image || undefined,
      enrollmentDate: form.enrollmentDate || undefined,
      address: form.address || undefined,
      emergencyName: form.emergencyName || undefined,
      emergencyPhone: form.emergencyPhone || undefined,
      emergencyRelation: form.emergencyRelation || undefined,
    };
    try {
      if (editing) {
        await updateChild({ id: editing._id, ...payload });
        toast.success("تم تحديث بيانات الطفل");
      } else {
        await addChild(payload);
        toast.success("تمت إضافة الطفل بنجاح");
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    }
  };

  const onDelete = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطفل؟")) return;
    try {
      await removeChild({ id });
      toast.success("تم حذف الطفل");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div>
      <PageHeader
        title="إدارة الأطفال"
        subtitle={`إجمالي الأطفال: ${children.length}`}
        action={
          <PrimaryButton onClick={openAdd}>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة طفل
            </span>
          </PrimaryButton>
        }
      />

      {children.length === 0 ? (
        <Card>
          <EmptyState
            icon={Baby}
            title="لا يوجد أطفال بعد"
            subtitle="ابدأ بإضافة أول طفل إلى الأكاديمية"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child, i) => {
            const parent = parents.find((p) => p._id === child.parentId);
            const teacher = staff.find((s) => s._id === child.teacherId);
            return (
              <motion.div
                key={child._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {child.image ? (
                        <img
                          src={child.image}
                          alt={child.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-violet-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-lg">
                          {child.name[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-800">{child.name}</h3>
                        <p className="text-xs text-slate-500">{child.className}</p>
                        <p className="text-xs text-violet-600 font-medium mt-0.5">
                          {calcAge(child.birthDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewing(child)}
                        className="p-2 rounded-lg hover:bg-violet-50 text-violet-500"
                        title="عرض الملف"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(child)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(child._id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الجنس</span>
                      <span className="font-medium">{child.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ولي الأمر</span>
                      <span className="font-medium">{parent?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المدرس المسؤول</span>
                      <span className="font-medium">{teacher?.name || "—"}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* نافذة عرض الملف الكامل */}
      <ChildProfileModal
        child={viewing}
        onClose={() => setViewing(null)}
        parent={parents.find((p) => p._id === viewing?.parentId)}
        teacher={staff.find((s) => s._id === viewing?.teacherId)}
        fees={fees.filter((f) => f.childId === viewing?._id)}
        payments={payments.filter((p) => p.childId === viewing?._id)}
      />

      {/* نافذة الإضافة / التعديل */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل بيانات الطفل" : "إضافة طفل جديد"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="اسم الطفل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="تاريخ الميلاد"
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              required
            />
            <Select
              label="الجنس"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الفصل / المجموعة"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              placeholder="مثال: روضة أولى"
              required
            />
            <Input
              label="تاريخ الالتحاق"
              type="date"
              value={form.enrollmentDate}
              onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
            />
          </div>
          
          <Select
            label="ولي الأمر"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            required
          >
            <option value="">اختر ولي الأمر</option>
            {parents.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            label="المدرس المسؤول"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          >
            <option value="">اختر المدرس</option>
            {staff
              .filter((s) => s.role === "مدرس")
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </Select>
          <Input
            label="العنوان"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit">
              {editing ? "حفظ التعديلات" : "إضافة"}
            </PrimaryButton>
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
    </div>
  );
}

function ChildProfileModal({
  child,
  onClose,
  parent,
  teacher,
  fees,
  payments,
}: {
  child: any;
  onClose: () => void;
  parent: any;
  teacher: any;
  fees: any[];
  payments: any[];
}) {
  if (!child) return null;
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* رأس الملف */}
        <div className="bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {child.image ? (
                <img
                  src={child.image}
                  alt={child.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-3xl">
                  {child.name[0]}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-extrabold">{child.name}</h3>
                <p className="text-white/80 text-sm">{child.className}</p>
                <p className="text-white/90 text-sm font-medium mt-1">
                  {calcAge(child.birthDate)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={Calendar} label="تاريخ الميلاد" value={child.birthDate} />
            <InfoItem icon={User} label="الجنس" value={child.gender} />
            <InfoItem
              icon={Calendar}
              label="تاريخ الالتحاق"
              value={child.enrollmentDate || "—"}
            />
            <InfoItem icon={User} label="ولي الأمر" value={parent?.name || "—"} />
            <InfoItem icon={User} label="المدرس المسؤول" value={teacher?.name || "—"} />
            <InfoItem icon={MapPin} label="العنوان" value={child.address || "—"} />
          </div>

          {/* بيانات الطوارئ */}
          {(child.emergencyName || child.emergencyPhone) && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> بيانات الطوارئ
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-amber-600 text-xs">الاسم</p>
                  <p className="font-medium text-slate-800">
                    {child.emergencyName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-amber-600 text-xs">الهاتف</p>
                  <p className="font-medium text-slate-800" dir="ltr">
                    {child.emergencyPhone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-amber-600 text-xs">صلة القرابة</p>
                  <p className="font-medium text-slate-800">
                    {child.emergencyRelation || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* الملخص المالي */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3">الملخص المالي</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500">إجمالي الرسوم</p>
                <p className="font-bold text-slate-800">{totalFees.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600">المدفوع</p>
                <p className="font-bold text-emerald-700">{totalPaid.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 text-center">
                <p className="text-xs text-rose-600">المتبقي</p>
                <p className="font-bold text-rose-700">
                  {(totalFees - totalPaid).toLocaleString()} ج.م
                </p>
              </div>
            </div>
          </div>

          {/* سجل الرسوم */}
          {fees.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-3">سجل الرسوم</h4>
              <div className="space-y-2">
                {fees.map((f) => (
                  <div
                    key={f._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      شهر {f.month}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {f.paid.toLocaleString()} / {f.amount.toLocaleString()} ج.م
                      </span>
                      <Badge status={f.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* سجل المدفوعات */}
          {payments.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-3">سجل المدفوعات</h4>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {p.amount.toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.method} — {p.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الملاحظات */}
          {child.notes && (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">ملاحظات</h4>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                {child.notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-violet-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
