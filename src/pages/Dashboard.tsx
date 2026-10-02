import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StatCard, Card } from "../components/ui";
import {
  Baby,
  Users,
  UserCog,
  Wallet,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";

export function Dashboard() {
  // التاريخ والوقت الحاليان
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // الشهر الحالي تلقائيًا بصيغة YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
  });

  // إنشاء قائمة آخر 12 شهر تلقائيًا
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - i);

    const value = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;

    return {
      value,
      label: date.toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  // البيانات الأساسية
  const children = useQuery(api.children.list) || [];
  const parents = useQuery(api.parents.list) || [];
  const staff = useQuery(api.staff.list) || [];

  // البيانات المالية للشهر المحدد فقط
  const fees =
    useQuery(api.fees.listByMonth, {
      month: selectedMonth,
    }) || [];

  const payments =
    useQuery(api.payments.listByMonth, {
      month: selectedMonth,
    }) || [];

  const expenses =
    useQuery(api.expenses.listByMonth, {
      month: selectedMonth,
    }) || [];

  // الحسابات المالية للشهر المحدد
  const totalFees = fees.reduce(
    (sum, fee) => sum + fee.amount,
    0,
  );

  const totalPaid = fees.reduce(
    (sum, fee) => sum + fee.paid,
    0,
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const remaining = Math.max(
    0,
    totalFees - totalPaid,
  );

  // أحدث 5 مدفوعات للشهر المحدد
  const recentPayments = [...payments]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const selectedMonthLabel =
    monthOptions.find(
      (month) => month.value === selectedMonth,
    )?.label || selectedMonth;

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white p-8 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
              مرحباً بك في أكاديمية شروق الشمس بكفر أحمد شلبي
            </h1>

            <p className="text-white/80">
              نظرة عامة على أداء الأكاديمية لشهر{" "}
              {selectedMonthLabel}
            </p>
          </div>

          {/* اختيار الشهر */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-2">
            <CalendarDays className="w-5 h-5 text-white" />

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
              className="bg-transparent text-white font-bold outline-none cursor-pointer px-2 py-1"
            >
              {monthOptions.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                  className="text-slate-800 bg-white"
                >
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Baby}
          label="الأطفال المسجلون"
          value={children.length}
          color="bg-violet-500"
          delay={0.05}
        />

        <StatCard
          icon={Users}
          label="أولياء الأمور"
          value={parents.length}
          color="bg-fuchsia-500"
          delay={0.1}
        />

        <StatCard
          icon={UserCog}
          label="الموظفون والمدرسون"
          value={staff.length}
          color="bg-sky-500"
          delay={0.15}
        />

        <StatCard
          icon={Wallet}
          label={`مدفوعات ${selectedMonthLabel}`}
          value={`${totalPayments.toLocaleString()} ج.م`}
          color="bg-emerald-500"
          delay={0.2}
        />
      </div>

      {/* الملخص المالي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-violet-600" />

              <h3 className="font-bold text-slate-800">
                الملخص المالي
              </h3>
            </div>

            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
              {selectedMonthLabel}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                إجمالي الرسوم
              </span>

              <span className="font-bold">
                {totalFees.toLocaleString()} ج.م
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                المدفوع
              </span>

              <span className="font-bold text-emerald-600">
                {totalPaid.toLocaleString()} ج.م
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                المتبقي
              </span>

              <span className="font-bold text-rose-600">
                {remaining.toLocaleString()} ج.م
              </span>
            </div>

            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-slate-500">
                المصروفات
              </span>

              <span className="font-bold text-amber-600">
                {totalExpenses.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        </Card>

        {/* أحدث المدفوعات */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">
              أحدث المدفوعات
            </h3>

            <span className="text-xs font-semibold text-slate-500">
              {selectedMonthLabel}
            </span>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">
                لا توجد مدفوعات في هذا الشهر
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => {
                const child = children.find(
                  (child) =>
                    child._id === payment.childId,
                );

                return (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {child?.name || "طفل"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {payment.date}
                      </p>
                    </div>

                    <span className="font-bold text-emerald-600">
                      {payment.amount.toLocaleString()} ج.م
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* الفوتر */}
      <footer className="mt-8 pt-5 border-t border-slate-200 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-slate-500">
          <span>
            التاريخ:{" "}
            {currentDateTime.toLocaleDateString(
              "ar-EG",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </span>

          <span className="hidden sm:block text-slate-300">
            |
          </span>

          <span>
            الساعة:{" "}
            {currentDateTime.toLocaleTimeString(
              "ar-EG",
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              },
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}