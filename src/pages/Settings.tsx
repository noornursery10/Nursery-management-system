import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PageHeader,
  Card,
  PrimaryButton,
  Input,
  EmptyState,
} from "../components/ui";
import {
  Building2,
  Camera,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const settings = useQuery(api.settings.get);
  const me = useQuery(api.auth.loggedInUser);
  const updateSettings = useMutation(api.settings.update);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // تهيئة القيم عند تحميل الإعدادات
  const initialized = useRef(false);
  if (settings && !initialized.current) {
    initialized.current = true;
    setName(settings.name || "");
    setLogo(settings.logo);
    setPhone(settings.phone || "");
    setEmail(settings.email || "");
    setAddress(settings.address || "");
  }

  const isAdmin = me?.isAdmin;

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الشعار يجب ألا يتجاوز 2 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        name,
        logo,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      });
      toast.success("تم حفظ إعدادات الأكاديمية بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="إعدادات الأكاديمية" />
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
        title="إعدادات الأكاديمية"
        subtitle="تعديل اسم الأكاديمية وشعارها وبياناتها الأساسية"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بطاقة الشعار */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-5xl overflow-hidden shadow-lg">
                {logo ? (
                  <img
                    src={logo}
                    alt={name || "شعار الكادمية"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-14 h-14" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 left-0 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
                title="تغيير الشعار"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickLogo}
              />
            </div>
            <h3 className="mt-4 font-bold text-lg text-slate-800">
              {name || "أكاديمية شروق الشمس"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              اضغط على أيقونة الكاميرا لتغيير الشعار
            </p>
          </div>
        </Card>

        {/* نموذج البيانات */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-800">البيانات الأساسية</h3>
          </div>
          <form onSubmit={onSave} className="space-y-4">
            <Input
              label="اسم الكادمية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute right-3 top-[38px] w-4 h-4 text-slate-400" />
                <Input
                  label="رقم الهاتف"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="pr-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400" />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="pr-10"
                />
              </div>
            </div>
            <div className="relative">
              <MapPin className="absolute right-3 top-[38px] w-4 h-4 text-slate-400" />
              <Input
                label="العنوان"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
