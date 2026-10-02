import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
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
import {
  ShieldCheck,
  Plus,
  Trash2,
  KeyRound,
  Mail,
  User,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير",
};

const roleColors: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  manager: "bg-sky-100 text-sky-700",
};

export function Users() {
  const users = useQuery(api.users.list) || [];
  const me = useQuery(api.auth.loggedInUser);
  const createUser = useAction(api.users.create);
  const updateRole = useMutation(api.users.updateRole);
  const toggleActive = useMutation(api.users.toggleActive);
  const removeUser = useMutation(api.users.remove);
  const resetPassword = useAction(api.users.resetPassword);

  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
  });
  const [newPassword, setNewPassword] = useState("");

  const isAdmin = me?.isAdmin;

  const resetForm = () =>
    setForm({ name: "", email: "", password: "", role: "manager" });

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast.success("تم إنشاء المستخدم بنجاح");
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    }
  };

  const onChangeRole = async (userId: any, role: string) => {
    try {
      await updateRole({ userId, role });
      toast.success("تم تحديث الصلاحية");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    }
  };

  const onToggleActive = async (userId: any) => {
    try {
      await toggleActive({ userId });
      toast.success("تم تحديث حالة الحساب");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    }
  };

  const onDelete = async (userId: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await removeUser({ userId });
      toast.success("تم حذف المستخدم");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    }
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal) return;
    try {
      await resetPassword({ userId: resetModal._id, newPassword });
      toast.success("تم إعادة تعيين كلمة المرور");
      setResetModal(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="المستخدمون والصلاحيات" />
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="صلاحية غير كافية"
            subtitle="هذا القسم متاح لمدير النظام فقط."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="المستخدمون والصلاحيات"
        subtitle={`إجمالي المستخدمين: ${users.length}`}
        action={
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة مستخدم
            </span>
          </PrimaryButton>
        }
      />

      {users.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="لا يوجد مستخدمون بعد"
            subtitle="أضف مستخدمين ومنحهم الصلاحيات المناسبة"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u, i) => {
            const isMe = u._id === me?._id;
            const isDisabled = u.active === false;
            return (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`p-5 hover:shadow-lg hover:-translate-y-1 transition-all ${
                    isDisabled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-lg">
                        {(u.name || u.email || "م")[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {u.name || "بدون اسم"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            roleColors[u.role || "manager"] ||
                            roleColors.manager
                          }`}
                        >
                          {roleLabels[u.role || "manager"] || "مدير"}
                        </span>
                        {isDisabled && (
                          <span className="mr-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                            معطّل
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setResetModal(u)}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-500"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => onToggleActive(u._id)}
                          className={`p-2 rounded-lg ${
                            isDisabled
                              ? "hover:bg-emerald-50 text-emerald-500"
                              : "hover:bg-slate-100 text-slate-500"
                          }`}
                          title={isDisabled ? "تفعيل الحساب" : "تعطيل الحساب"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(u._id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span dir="ltr">{u.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 text-xs">الصلاحية:</span>
                      <select
                        value={u.role || "manager"}
                        onChange={(e) => onChangeRole(u._id, e.target.value)}
                        disabled={isMe}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none bg-white disabled:opacity-50"
                      >
                        <option value="admin">مدير النظام</option>
                        <option value="manager">مدير</option>
                      </select>
                    </div>
                    {isMe && (
                      <p className="text-xs text-slate-400">(حسابك الحالي)</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* نافذة إضافة مستخدم */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إضافة مستخدم جديد"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <Input
            label="الاسم الكامل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            dir="ltr"
          />
          <Input
            label="كلمة المرور (8 أحرف على الأقل)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <Select
            label="الصلاحية / الدور"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">مدير النظام</option>
            <option value="manager">مدير</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit">إنشاء المستخدم</PrimaryButton>
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

      {/* نافذة إعادة تعيين كلمة المرور */}
      <Modal
        open={!!resetModal}
        onClose={() => setResetModal(null)}
        title="إعادة تعيين كلمة المرور"
      >
        {resetModal && (
          <form onSubmit={onResetPassword} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <p className="font-bold text-slate-800">
                {resetModal.name || resetModal.email}
              </p>
              <p className="text-slate-500 mt-1" dir="ltr">
                {resetModal.email}
              </p>
            </div>
            <Input
              label="كلمة المرور الجديدة (8 أحرف على الأقل)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <div className="flex gap-3 pt-2">
              <PrimaryButton type="submit">إعادة التعيين</PrimaryButton>
              <button
                type="button"
                onClick={() => setResetModal(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
