import { query, mutation, action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import {
  getAuthUserId,
  createAccount,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";

export const ROLES = ["admin", "manager"];

// قائمة المستخدمين — لمدير النظام فقط
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.get(userId);
    if (!me?.isAdmin) return [];
    return await ctx.db.query("users").order("desc").collect();
  },
});

// إنشاء مستخدم جديد — لمدير النظام فقط
export const create = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("يجب تسجيل الدخول أولاً.");
    }
    const me = await ctx.runQuery(api.auth.loggedInUser);
    if (!me?.isAdmin) {
      throw new ConvexError("ليس لديك صلاحية لإنشاء مستخدمين.");
    }

    const email = args.email.trim().toLowerCase();
    if (!email) throw new ConvexError("البريد الإلكتروني مطلوب.");
    if (args.password.length < 8) {
      throw new ConvexError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    }
    if (!ROLES.includes(args.role)) {
      throw new ConvexError("دور غير صالح.");
    }

    // التحقق من عدم وجود مستخدم بنفس البريد
    const existing = await ctx.runQuery(api.users.findByEmail, { email });
    if (existing) {
      throw new ConvexError("يوجد مستخدم مسجل بهذا البريد الإلكتروني بالفعل.");
    }

    // إنشاء الحساب
    await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.password },
      profile: {
        name: args.name,
        email,
        role: args.role,
        isAdmin: args.role === "admin",
      },
    });
  },
});

// تحديث دور المستخدم — لمدير النظام فقط
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const meId = await getAuthUserId(ctx);
    if (!meId) throw new ConvexError("يجب تسجيل الدخول أولاً.");
    const me = await ctx.db.get(meId);
    if (!me?.isAdmin) throw new ConvexError("ليس لديك صلاحية.");

    if (!ROLES.includes(args.role)) {
      throw new ConvexError("دور غير صالح.");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError("المستخدم غير موجود.");

    // منع إزالة آخر مدير نظام
    if (target.isAdmin && args.role !== "admin") {
      const admins = (await ctx.db.query("users").collect()).filter(
        (u) => u.isAdmin,
      );
      if (admins.length <= 1) {
        throw new ConvexError("لا يمكن إزالة آخر مدير نظام في النظام.");
      }
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      isAdmin: args.role === "admin",
    });
  },
});

// تعطيل / تفعيل مستخدم — لمدير النظام فقط
export const toggleActive = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const meId = await getAuthUserId(ctx);
    if (!meId) throw new ConvexError("يجب تسجيل الدخول أولاً.");
    const me = await ctx.db.get(meId);
    if (!me?.isAdmin) throw new ConvexError("ليس لديك صلاحية.");

    if (args.userId === meId) {
      throw new ConvexError("لا يمكنك تعطيل حسابك الحالي.");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError("المستخدم غير موجود.");

    if (target.isAdmin && target.active !== false) {
      const admins = (await ctx.db.query("users").collect()).filter(
        (u) => u.isAdmin && u.active !== false,
      );
      if (admins.length <= 1) {
        throw new ConvexError("لا يمكن تعطيل آخر مدير نظام نشط.");
      }
    }

    await ctx.db.patch(args.userId, { active: target.active === false });
  },
});

// حذف مستخدم — لمدير النظام فقط
export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const meId = await getAuthUserId(ctx);
    if (!meId) throw new ConvexError("يجب تسجيل الدخول أولاً.");
    const me = await ctx.db.get(meId);
    if (!me?.isAdmin) throw new ConvexError("ليس لديك صلاحية.");

    if (args.userId === meId) {
      throw new ConvexError("لا يمكنك حذف حسابك الحالي.");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError("المستخدم غير موجود.");

    if (target.isAdmin) {
      const admins = (await ctx.db.query("users").collect()).filter(
        (u) => u.isAdmin,
      );
      if (admins.length <= 1) {
        throw new ConvexError("لا يمكن حذف آخر مدير نظام في النظام.");
      }
    }

    await ctx.db.delete(args.userId);
  },
});

// إعادة تعيين كلمة مرور مستخدم — لمدير النظام فقط
export const resetPassword = action({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const meId = await getAuthUserId(ctx);
    if (!meId) throw new ConvexError("يجب تسجيل الدخول أولاً.");
    const me = await ctx.runQuery(api.auth.loggedInUser);
    if (!me?.isAdmin) throw new ConvexError("ليس لديك صلاحية.");

    if (args.newPassword.length < 8) {
      throw new ConvexError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    }

    const target = await ctx.runQuery(api.users.getById, {
      userId: args.userId,
    });
    if (!target?.email) {
      throw new ConvexError("هذا المستخدم ليس لديه بريد إلكتروني.");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: target.email, secret: args.newPassword },
    });
  },
});

// تحديث الملف الشخصي (الاسم والصورة) — للمستخدم الحالي
export const updateProfile = mutation({
  args: {
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً.");

    if (!args.name.trim()) {
      throw new ConvexError("الاسم مطلوب.");
    }

    await ctx.db.patch(userId, {
      name: args.name.trim(),
      image: args.image,
    });
  },
});

// تغيير البريد الإلكتروني — للمستخدم الحالي
// يتطلب كلمة المرور الحالية للتحقق، ثم ينشئ حسابًا جديدًا بالبريد الجديد
// ويحذف الحساب القديم.
export const changeEmail = action({
  args: {
    newEmail: v.string(),
    currentPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً.");

    const email = args.newEmail.trim().toLowerCase();
    if (!email) throw new ConvexError("البريد الإلكتروني مطلوب.");

    const me = await ctx.runQuery(api.auth.loggedInUser);
    if (!me?.email) {
      throw new ConvexError("هذا الحساب ليس لديه بريد إلكتروني.");
    }

    // التحقق من عدم استخدام البريد الجديد
    const existing = await ctx.runQuery(api.users.findByEmail, { email });
    if (existing && existing._id !== userId) {
      throw new ConvexError("يوجد مستخدم مسجل بهذا البريد الإلكتروني بالفعل.");
    }

    // التحقق من كلمة المرور الحالية (يطرح خطأ إذا كانت غير صحيحة)
    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: me.email, secret: args.currentPassword },
      });
    } catch (err) {
      throw new ConvexError("كلمة المرور الحالية غير صحيحة.");
    }

    // إنشاء حساب جديد بالبريد الجديد (نفس كلمة المرور)
    await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.currentPassword },
      profile: {
        name: me.name,
        email,
        role: me.role,
        isAdmin: me.isAdmin,
        image: me.image,
      },
    });

    // حذف الحساب القديم
    await ctx.runMutation(api.users.deleteOldAccount, {
      userId,
      oldEmail: me.email,
    });
  },
});

// حذف الحساب القديم بعد تغيير البريد
export const deleteOldAccount = mutation({
  args: {
    userId: v.id("users"),
    oldEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.oldEmail),
      )
      .first();
    if (account && account.userId === args.userId) {
      await ctx.db.delete(account._id);
    }
  },
});

// البحث عن مستخدم بالبريد الإلكتروني
export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

// جلب مستخدم بالمعرف
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});








