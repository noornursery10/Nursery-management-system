import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import {
  LayoutDashboard,
  Users,
  Baby,
  CalendarCheck,
  UserCog,
  Wallet,
  Receipt,
  ReceiptText,
  Menu,
  // ShieldCheck,
  Settings,
  Building2,
} from "lucide-react";
import { useState } from "react";

type Page =
  | "dashboard"
  | "children"
  | "parents"
  | "attendance"
  | "staff"
  | "fees"
  | "expenses"
  | "receipts"
  | "users"
  | "account"
  | "settings";

const navItems: { key: Page; label: string; icon: any }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { key: "parents", label: "أولياء الأمور", icon: Users },
  { key: "children", label: "الأطفال", icon: Baby },
  { key: "staff", label: "الموظفون والمدرسون", icon: UserCog },
  { key: "attendance", label: "الحضور والانصراف", icon: CalendarCheck },
  { key: "fees", label: "الرسوم والمدفوعات", icon: Wallet },
  { key: "expenses", label: "المصروفات", icon: Receipt },
  { key: "receipts", label: "سجل الإيصالات", icon: ReceiptText },
  // { key: "users", label: "المستخدمون والصلاحيات", icon: ShieldCheck },
  // { key: "account", label: "حسابي / الإعدادات", icon: Settings },
];

export function Layout({
  page,
  onNavigate,
  children,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useQuery(api.auth.loggedInUser);
  const settings = useQuery(api.settings.get);

  // قسم المستخدمين يظهر فقط لمدير النظام، وحسابي للجميع
  const visibleNavItems = navItems;

  const nurseryName = "أكاديمية شروق الشمس";
  const nurseryLogo = settings?.logo;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-gradient-to-b from-violet-700 via-violet-800 to-fuchsia-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          
          className="w-full flex items-center gap-3 px-6 py-6 border-b border-white/10 hover:bg-white/5 transition-colors text-right"
          title="إعدادات الأكاديمية"
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
            {nurseryLogo ? (
              <img
                src={nurseryLogo}
                alt={nurseryName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-lg leading-tight truncate">
              {nurseryName}
            </h1>
            <p className="text-xs text-white/60">نظام الإدارة المتكامل</p>
          </div>
        </button>

        <nav className="px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-violet-700 shadow-lg"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* الخلفية عند فتح القائمة على الجوال */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* المحتوى */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="hidden lg:block">
            <h2 className="font-bold text-slate-800">
              {navItems.find((n) => n.key === page)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || user?.email?.split("@")[0] || "مدير النظام"}
              </p>
              <p className="text-xs text-slate-500">مرحباً بك</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold overflow-hidden">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "الصورة الشخصية"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.name || user?.email || "م")[0]
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
