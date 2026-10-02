import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateReceiptNumber } from "./receipts";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payments").order("desc").collect();
  },
});

// جلب مدفوعات شهر معين — YYYY-MM
export const listByMonth = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const start = `${args.month}-01`;
    const end = `${args.month}-31`;

    return await ctx.db
      .query("payments")
      .withIndex("by_date", (q) =>
        q.gte("date", start).lte("date", end)
      )
      .collect();
  },
});

export const listByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

export const add = mutation({
  args: {
    childId: v.id("children"),
    feeId: v.optional(v.id("fees")),
    amount: v.number(),
    date: v.string(),
    method: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // جلب اسم الموظف الحالي
    const userId = await getAuthUserId(ctx);
    let staffName = "";
    if (userId) {
      const user = await ctx.db.get(userId);
      staffName = user?.name || user?.email?.split("@")[0] || "";
    }

    // توليد رقم الإيصال
    const receiptNumber = await generateReceiptNumber(ctx);

    // إدراج الدفعة
    const paymentId = await ctx.db.insert("payments", {
      ...args,
      receiptNumber,
      staffName,
    });

    // تحديث الرسوم المرتبطة
    let feeInfo: any = null;
    if (args.feeId) {
      const fee = await ctx.db.get(args.feeId);
      if (fee) {
        const newPaid = fee.paid + args.amount;
        const status =
          newPaid >= fee.amount ? "paid" : newPaid > 0 ? "partial" : "unpaid";
        await ctx.db.patch(args.feeId, { paid: newPaid, status });
        feeInfo = {
          amount: fee.amount,
          discount: fee.discount ?? 0,
          paid: newPaid,
          remaining: Math.max(0, fee.amount - (fee.discount ?? 0) - newPaid),
          feeType: fee.feeType,
          month: fee.month,
        };
      }
    }

    // إنشاء إيصال موحد
    await ctx.db.insert("receipts", {
      receiptNumber,
      type: "payment",
      childId: args.childId,
      feeId: args.feeId,
      paymentId,
      amount: feeInfo?.amount ?? args.amount,
      discount: feeInfo?.discount ?? 0,
      paid: args.amount,
      remaining: feeInfo?.remaining ?? 0,
      method: args.method,
      description: feeInfo?.feeType ?? "رسوم شهرية",
      month: feeInfo?.month,
      staffName,
      createdAt: Date.now(),
    });

    // إرجاع كائن الدفعة الكامل
    return {
      _id: paymentId,
      childId: args.childId,
      feeId: args.feeId,
      amount: args.amount,
      date: args.date,
      method: args.method,
      notes: args.notes,
      receiptNumber,
      staffName,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (payment?.feeId) {
      const fee = await ctx.db.get(payment.feeId);
      if (fee) {
        const newPaid = Math.max(0, fee.paid - payment.amount);
        const status =
          newPaid >= fee.amount ? "paid" : newPaid > 0 ? "partial" : "unpaid";
        await ctx.db.patch(payment.feeId, { paid: newPaid, status });
      }
    }

    // حذف الإيصال المرتبط
    if (payment?.receiptNumber) {
      const receiptNumber = payment.receiptNumber;
      const receipt = await ctx.db
        .query("receipts")
        .withIndex("by_receiptNumber", (q) =>
          q.eq("receiptNumber", receiptNumber),
        )
        .first();
      if (receipt) {
        await ctx.db.delete(receipt._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});
