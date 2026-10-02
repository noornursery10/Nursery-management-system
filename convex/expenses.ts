import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateReceiptNumber } from "./receipts";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("expenses").order("desc").collect();
  },
});

// جلب مصروفات شهر معين — YYYY-MM
export const listByMonth = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const start = `${args.month}-01`;
    const end = `${args.month}-31`;

    return await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) =>
        q.gte("date", start).lte("date", end)
      )
      .collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    amount: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let staffName = "";

    if (userId) {
      const user = await ctx.db.get(userId);
      staffName = user?.name || user?.email?.split("@")[0] || "";
    }

    const receiptNumber = await generateReceiptNumber(ctx);

    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      receiptNumber,
      staffName,
    });

    await ctx.db.insert("receipts", {
      receiptNumber,
      type: "expense",
      expenseId,
      amount: args.amount,
      discount: 0,
      paid: args.amount,
      remaining: 0,
      method: "نقدي",
      description: `${args.title} — ${args.category}`,
      staffName,
      createdAt: Date.now(),
    });

    return { _id: expenseId, receiptNumber };
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.id);

    if (expense?.receiptNumber) {
      const receipt = await ctx.db
        .query("receipts")
        .withIndex("by_receiptNumber", (q) =>
          q.eq("receiptNumber", expense.receiptNumber!)
        )
        .first();

      if (receipt) {
        await ctx.db.delete(receipt._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});