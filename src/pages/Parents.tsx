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
import { Users, Plus, Pencil, Trash2, Phone, Baby, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Parents() {
  const parents = useQuery(api.parents.list) || [];
  const children = useQuery(api.children.list) || [];
  const addParent = useMutation(api.parents.add);
  const updateParent = useMutation(api.parents.update);
  const removeParent = useMutation(api.parents.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    relation: "أب",
    address: "",
    notes: "",
  });

  const resetForm = () =>
    setForm({ name: "", phone: "", email: "", relation: "أب", address: "", notes: "" });

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email || "",
      relation: p.relation,
      address: p.address || "",
      notes: p.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateParent({ id: editing._id, ...form });
        toast.success("تم تحديث بيانات ولي الأمر");
      } else {
        await addParent(form);
        toast.success("تمت إضافة ولي الأمر بنجاح");
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    }
  };

  const onDelete = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف ولي الأمر؟")) return;
    try {
      await removeParent({ id });
      toast.success("تم حذف ولي الأمر");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div>
      <PageHeader
        title="أولياء الأمور"
        subtitle={`إجمالي أولياء الأمور: ${parents.length}`}
        action={
          <PrimaryButton onClick={openAdd}>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة ولي أمر
            </span>
          </PrimaryButton>
        }
      />

      {parents.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="لا يوجد أولياء أمور بعد"
            subtitle="ابدأ بإضافة أول ولي أمر"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((parent, i) => {
            const parentChildren = children.filter((c) => c.parentId === parent._id);
            return (
              <motion.div
                key={parent._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg">
                        {parent.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{parent.name}</h3>
                        <p className="text-xs text-slate-500">{parent.relation}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(parent)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(parent._id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span dir="ltr">{parent.phone}</span>
                    </div>
                    {parent.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{parent.email}</span>
                      </div>
                    )}
                    {parent.address && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{parent.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Baby className="w-4 h-4 text-violet-500" />
                      <span className="text-slate-600">
                        {parentChildren.length} طفل
                      </span>
                    </div>
                    {parentChildren.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parentChildren.map((c) => (
                          <span
                            key={c._id}
                            className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium"
                          >
                            {c.name}
                          </span>
                        ))}
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
        title={editing ? "تعديل بيانات ولي الأمر" : "إضافة ولي أمر جديد"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="الاسم الكامل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
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
          <Select
            label="صلة القرابة"
            value={form.relation}
            onChange={(e) => setForm({ ...form, relation: e.target.value })}
          >
            <option value="أب">أب</option>
            <option value="أم">أم</option>
            <option value="جد">جد</option>
            <option value="جدة">جدة</option>
            <option value="وصي">وصي</option>
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
