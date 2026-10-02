import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// توليد رقم إيصال متسلسل موحد
// الصيغة: R-YYYYMM-XXXX (مثال: R-202501-0001)
export async function generateReceiptNumber(ctx: any): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `R-${year}${month}-`;

  const existing = await ctx.db
    .query("receipts")
    .withIndex("by_receiptNumber", (q: any) =>
      q
        .gte("receiptNumber", prefix)
        .lt("receiptNumber", prefix + "\uffff"),
    )
    .collect();

  const seq = existing.length + 1;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// قائمة الإيصالات — مرتبة من الأحدث
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("receipts").order("desc").collect();
  },
});

// جلب إيصال واحد بالمعرف
export const getById = query({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// إنشاء إيصال (يُستدعى داخليًا من الدفعات والمصروفات)
export const create = mutation({
  args: {
    type: v.string(), // fee / payment / expense
    childId: v.optional(v.id("children")),
    feeId: v.optional(v.id("fees")),
    paymentId: v.optional(v.id("payments")),
    expenseId: v.optional(v.id("expenses")),
    amount: v.number(),
    discount: v.optional(v.number()),
    paid: v.optional(v.number()),
    remaining: v.optional(v.number()),
    method: v.optional(v.string()),
    description: v.optional(v.string()),
    month: v.optional(v.string()),
    staffName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const receiptNumber = await generateReceiptNumber(ctx);
    const id = await ctx.db.insert("receipts", {
      ...args,
      receiptNumber,
      createdAt: Date.now(),
    });
    return { _id: id, receiptNumber };
  },
});

// حذف إيصال
export const remove = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
