
import { useState } from "react";
import { Toaster } from "sonner";

import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Children } from "./pages/Children";
import { Parents } from "./pages/Parents";
import { Attendance } from "./pages/Attendance";
import { Staff } from "./pages/Staff";
import { Fees } from "./pages/Fees";
import { Expenses } from "./pages/Expenses";
import { Receipts } from "./pages/Receipts";
// import { Users } from "./pages/Users";
import { Account } from "./pages/Account";
import { Settings } from "./pages/Settings";

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

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <Layout page={page} onNavigate={setPage}>
        {page === "dashboard" && <Dashboard />}
        {page === "children" && <Children />}
        {page === "parents" && <Parents />}
        {page === "attendance" && <Attendance />}
        {page === "staff" && <Staff />}
        {page === "fees" && <Fees />}
        {page === "expenses" && <Expenses />}
        {page === "receipts" && <Receipts />}
        {/* {page === "users" && <Users />} */}
        {page === "account" && <Account />}
        {page === "settings" && <Settings />}
      </Layout>

      <Toaster position="top-center" richColors />
    </div>
  );
}
