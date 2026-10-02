import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance").order("desc").collect();
  },
});

export const record = mutation({
  args: {
    personType: v.string(),
    personId: v.string(),
    date: v.string(),
    status: v.string(),
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // تحقق من وجود سجل سابق لنفس الشخص في نفس اليوم
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_person_date", (q) =>
        q.eq("personId", args.personId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        notes: args.notes,
      });
    } else {
      await ctx.db.insert("attendance", {
        personType: args.personType,
        personId: args.personId,
        date: args.date,
        status: args.status,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        notes: args.notes,
      });
    }
  },
});
