import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fees").order("desc").collect();
  },
});

export const listByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fees")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();
  },
});

export const createFee = mutation({
  args: {
    childId: v.id("children"),
    feeType: v.optional(v.string()),
    month: v.string(),
    amount: v.number(),
    discount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // تحقق من عدم وجود رسوم سابقة لنفس الطفل في نفس الشهر
    const existing = await ctx.db
      .query("fees")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .filter((q) => q.eq(q.field("month"), args.month))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("fees", {
      childId: args.childId,
      feeType: args.feeType,
      month: args.month,
      amount: args.amount,
      discount: args.discount ?? 0,
      paid: 0,
      status: "unpaid",
      notes: args.notes,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("fees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
