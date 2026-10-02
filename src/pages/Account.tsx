import { useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PageHeader,
  Card,
  PrimaryButton,
  Input,
} from "../components/ui";
import {
  User,
  Mail,
  Lock,
  Camera,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير",
};

export function Account() {
  const me = useQuery(api.auth.loggedInUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const changeEmail = useAction(api.users.changeEmail);
  const changePassword = useAction(api.auth.changePassword);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // تهيئة القيم عند تحميل بيانات المستخدم
  const initialized = useRef(false);
  if (me && !initialized.current) {
    initialized.current = true;
    setName(me.name || "");
    setEmail(me.email || "");
    setImage(me.image);
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 2 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, image });
      toast.success("تم حفظ بياناتك بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("البريد الإلكتروني مطلوب.");
      return;
    }
    if (!currentPassword) {
      toast.error("أدخل كلمة المرور الحالية للتأكيد.");
      return;
    }
    setSavingEmail(true);
    try {
      await changeEmail({ newEmail: email, currentPassword });
      toast.success("تم تحديث البريد الإلكتروني. سجّل الدخول مجددًا بالبريد الجديد.");
      setCurrentPassword("");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    } finally {
      setSavingEmail(false);
    }
  };

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ newPassword });
      toast.success("تم تغيير كلمة المرور بنجاح");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!me) {
    return (
      <div>
        <PageHeader title="حسابي / الإعدادات" />
        <Card className="p-8 text-center text-slate-500">جارٍ التحميل...</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="حسابي / الإعدادات"
        subtitle="إدارة ملفك الشخصي وبيانات الدخول"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بطاقة الملف الشخصي */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-4xl overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt={me.name || "الصورة الشخصية"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (me.name || me.email || "م")[0]
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 left-0 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
                title="تغيير الصورة"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
            </div>
            <h3 className="mt-4 font-bold text-lg text-slate-800">
              {me.name || "بدون اسم"}
            </h3>
            <p className="text-sm text-slate-500" dir="ltr">
              {me.email || "—"}
            </p>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {roleLabels[me.role || "manager"] || "مدير"}
            </span>
          </div>
        </Card>

        {/* نماذج التعديل */}
        <div className="lg:col-span-2 space-y-6">
          {/* الاسم والصورة */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-800">الملف الشخصي</h3>
            </div>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <Input
                label="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={savingProfile}>
                  {savingProfile ? "جارٍ الحفظ..." : "حفظ الملف الشخصي"}
                </PrimaryButton>
              </div>
            </form>
          </Card>

          {/* البريد الإلكتروني */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-800">البريد الإلكتروني</h3>
            </div>
            <form onSubmit={onSaveEmail} className="space-y-4">
              <Input
                label="البريد الإلكتروني الجديد"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
              <Input
                label="كلمة المرور الحالية (للتأكيد)"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                بعد تغيير البريد، ستحتاج إلى تسجيل الدخول مجددًا بالبريد الجديد.
              </p>
              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={savingEmail}>
                  {savingEmail ? "جارٍ الحفظ..." : "تحديث البريد"}
                </PrimaryButton>
              </div>
            </form>
          </Card>

          {/* كلمة المرور */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-800">تغيير كلمة المرور</h3>
            </div>
            <form onSubmit={onSavePassword} className="space-y-4">
              <div className="relative">
                <Input
                  label="كلمة المرور الجديدة (8 أحرف على الأقل)"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <Input
                label="تأكيد كلمة المرور"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={savingPassword}>
                  {savingPassword ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
                </PrimaryButton>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
