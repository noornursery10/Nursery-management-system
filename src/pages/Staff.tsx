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
import { UserCog, Plus, Pencil, Trash2, Phone, Baby } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Staff() {
  const staff = useQuery(api.staff.list) || [];
  const children = useQuery(api.children.list) || [];
  const addStaff = useMutation(api.staff.add);
  const updateStaff = useMutation(api.staff.update);
  const removeStaff = useMutation(api.staff.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    role: "مدرس",
    phone: "",
    email: "",
    salary: "",
    hireDate: "",
  });

  const resetForm = () =>
    setForm({ name: "", role: "مدرس", phone: "", email: "", salary: "", hireDate: "" });

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role,
      phone: s.phone,
      email: s.email || "",
      salary: String(s.salary),
      hireDate: s.hireDate,
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, salary: Number(form.salary) };
      if (editing) {
        await updateStaff({ id: editing._id, ...data });
        toast.success("تم تحديث بيانات الموظف");
      } else {
        await addStaff(data);
        toast.success("تمت إضافة الموظف بنجاح");
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    }
  };

  const onDelete = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
    try {
      await removeStaff({ id });
      toast.success("تم حذف الموظف");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const roleColor: Record<string, string> = {
    مدرس: "bg-violet-100 text-violet-700",
    موظف: "bg-sky-100 text-sky-700",
    إدارة: "bg-amber-100 text-amber-700",
  };

  return (
    <div>
      <PageHeader
        title="الموظفون والمدرسون"
        subtitle={`إجمالي الموظفين: ${staff.length}`}
        action={
          <PrimaryButton onClick={openAdd}>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة موظف
            </span>
          </PrimaryButton>
        }
      />

      {staff.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserCog}
            title="لا يوجد موظفون بعد"
            subtitle="ابدأ بإضافة أول موظف أو مدرس"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s, i) => {
            const teacherChildren = children.filter((c) => c.teacherId === s._id);
            return (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg">
                      {s.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{s.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          roleColor[s.role] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(s._id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span dir="ltr">{s.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الراتب</span>
                    <span className="font-bold text-slate-800">
                      {s.salary.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">تاريخ التعيين</span>
                    <span className="font-medium">{s.hireDate}</span>
                  </div>
                  {s.role === "مدرس" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Baby className="w-4 h-4 text-violet-500" />
                      <span className="text-slate-600 text-sm">
                        {teacherChildren.length} طفل مسؤول عنهم
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="الاسم الكامل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="الوظيفة"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="مدرس">مدرس</option>
            <option value="موظف">موظف</option>
            <option value="إدارة">إدارة</option>
          </Select>
          <Input
            label="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          {/* <Input
            label="البريد الإلكتروني"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          /> */}
          <Input
            label="الراتب الشهري (ج.م)"
            type="number"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            required
          />
          <Input
            label="تاريخ التعيين"
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            required
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
