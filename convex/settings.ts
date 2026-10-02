import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// جلب إعدادات الحضانة — متاح للجميع
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      return {
        name: "حضانة المستقبل",
        logo: undefined,
        phone: undefined,
        email: undefined,
        address: undefined,
      };
    }
    return settings;
  },
});

// تحديث إعدادات الحضانة — لمدير النظام فقط
export const update = mutation({
  args: {
    name: v.string(),
    logo: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً.");
    const me = await ctx.db.get(userId);
    
      if (!userId) {
        throw new ConvexError("يجب تسجيل الدخول أولاً.");
      }

    if (!args.name.trim()) {
      throw new ConvexError("اسم الحضانة مطلوب.");
    }

    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name.trim(),
        logo: args.logo,
        phone: args.phone,
        email: args.email,
        address: args.address,
      });
    } else {
      await ctx.db.insert("settings", {
        name: args.name.trim(),
        logo: args.logo,
        phone: args.phone,
        email: args.email,
        address: args.address,
      });
    }
  },
});
