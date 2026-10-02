import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

export function LoginForm() {
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("من فضلك أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setSubmitting(true);

    try {
      await signIn("password", {
        email,
        password,
        flow: authMode,
      });

      if (authMode === "signUp") {
        toast.success("تم إنشاء الحساب بنجاح.");
      }
    }
    catch (error: any) {
      const msg = error?.message || "";

      if (authMode === "signUp") {
        if (
          msg.includes("already exists") ||
          msg.includes("Account already exists") ||
          msg.includes("already registered")
        ) {
          toast.error("يوجد حساب بالفعل بهذا البريد الإلكتروني.");
        } else {
          toast.error("تعذر إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى.");
        }
      } else {
        if (
          msg.includes("InvalidAccountId") ||
          msg.includes("Account not found")
        ) {
          toast.error("لا يوجد حساب بهذا البريد الإلكتروني.");
        } else if (
          msg.includes("Invalid password") ||
          msg.toLowerCase().includes("password")
        ) {
          toast.error("كلمة المرور غير صحيحة.");
        } else {
          toast.error("تعذر تسجيل الدخول. تحقق من بياناتك.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();

    toast.info(
      "لإعادة تعيين كلمة المرور، يرجى التواصل مع مدير النظام (Admin).",
    );

    setForgotMode(false);
  };

  return (
    <div className="w-full">
      {!forgotMode ? (
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>

            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                dir="ltr"
                autoComplete="email"
                className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-left"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              كلمة المرور
            </label>

            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
                autoComplete={
                  authMode === "signIn" ? "current-password" : "new-password"
                }
                className="w-full pr-11 pl-11 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-left"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={
                  showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {authMode === "signUp" && (
              <p className="text-xs text-slate-500 mt-2">
                كلمة المرور يجب أن تكون 8 أحرف على الأقل.
              </p>
            )}
          </div>

          {/* Forgot password */}
          {authMode === "signIn" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-95 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? authMode === "signIn"
                ? "جارٍ تسجيل الدخول..."
                : "جارٍ إنشاء الحساب..."
              : authMode === "signIn"
                ? "تسجيل الدخول"
                : "إنشاء الحساب"}
          </button>

          {/* Switch auth mode */}
          <div className="text-center text-sm text-slate-500">
            {authMode === "signIn" ? (
              <>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signUp")}
                  className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                >
                  إنشاء حساب
                </button>
              </>
            ) : (
              <>
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signIn")}
                  className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                >
                  تسجيل الدخول
                </button>
              </>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={onForgot} className="space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-7 h-7 text-violet-600" />
            </div>

            <h3 className="font-bold text-slate-800 text-lg">
              استعادة كلمة المرور
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              هذا نظام مغلق. لإعادة تعيين كلمة المرور، يرجى التواصل مع مدير
              النظام.
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-95 transition-all shadow-lg shadow-violet-200"
          >
            فهمت
          </button>

          <button
            type="button"
            onClick={() => setForgotMode(false)}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </form>
      )}
    </div>
  );
}