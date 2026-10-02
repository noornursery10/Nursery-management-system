import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("staff").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    salary: v.number(),
    hireDate: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("staff", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("staff"),
    name: v.string(),
    role: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    salary: v.number(),
    hireDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("staff") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
