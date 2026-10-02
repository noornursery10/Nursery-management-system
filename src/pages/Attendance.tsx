import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageHeader, Card, Badge, Select, Input } from "../components/ui";
import { CalendarCheck, Check, Clock, X, LogOut } from "lucide-react";
import { toast } from "sonner";

export function Attendance() {
  const children = useQuery(api.children.list) || [];
  const staff = useQuery(api.staff.list) || [];
  const record = useMutation(api.attendance.record);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<"children" | "staff">("children");

  const attendance = useQuery(api.attendance.listByDate, { date }) || [];

  const people = tab === "children" ? children : staff;

  const getStatus = (personId: string) => {
    const rec = attendance.find((a) => a.personId === personId);
    return rec?.status || null;
  };

  const mark = async (personId: string, status: string) => {
    try {
      await record({
        personType: tab,
        personId,
        date,
        status,
        checkIn: status === "present" || status === "late" ? new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : undefined,
        checkOut: status === "leave" ? new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : undefined,
      });
      toast.success("تم تسجيل الحالة");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const statusButtons = [
    { key: "present", label: "حاضر", icon: Check, cls: "bg-emerald-500 hover:bg-emerald-600" },
    { key: "late", label: "متأخر", icon: Clock, cls: "bg-amber-500 hover:bg-amber-600" },
    { key: "absent", label: "غائب", icon: X, cls: "bg-rose-500 hover:bg-rose-600" },
    { key: "leave", label: "انصراف", icon: LogOut, cls: "bg-sky-500 hover:bg-sky-600" },
  ];

  const stats = {
    present: attendance.filter((a) => a.status === "present").length,
    late: attendance.filter((a) => a.status === "late").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    leave: attendance.filter((a) => a.status === "leave").length,
  };

  return (
    <div>
      <PageHeader
        title="الحضور والانصراف"
        subtitle="تسجيل حضور وانصراف الأطفال والموظفين"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          label="التاريخ"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex gap-2 items-end">
          <button
            onClick={() => setTab("children")}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
              tab === "children"
                ? "bg-violet-600 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            الأطفال
          </button>
          <button
            onClick={() => setTab("staff")}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
              tab === "staff"
                ? "bg-violet-600 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            الموظفون
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-600">{stats.present}</p>
          <p className="text-xs text-slate-500">حاضر</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-600">{stats.late}</p>
          <p className="text-xs text-slate-500">متأخر</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-rose-600">{stats.absent}</p>
          <p className="text-xs text-slate-500">غائب</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-sky-600">{stats.leave}</p>
          <p className="text-xs text-slate-500">انصراف</p>
        </Card>
      </div>

      {people.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          لا يوجد {tab === "children" ? "أطفال" : "موظفون"} مسجلون بعد
        </Card>
      ) : (
        <div className="space-y-3">
          {people.map((person: any) => {
            const status = getStatus(person._id);
            return (
              <Card key={person._id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold">
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{person.name}</p>
                      <p className="text-xs text-slate-500">
                        {tab === "children" ? person.className : person.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {status && <Badge status={status} />}
                    <div className="flex gap-1.5">
                      {statusButtons.map((btn) => {
                        const Icon = btn.icon;
                        const active = status === btn.key;
                        return (
                          <button
                            key={btn.key}
                            onClick={() => mark(person._id, btn.key)}
                            title={btn.label}
                            className={`p-2 rounded-lg text-white transition-all ${
                              active
                                ? btn.cls + " ring-2 ring-offset-2 ring-violet-400"
                                : btn.cls + " opacity-60 hover:opacity-100"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
