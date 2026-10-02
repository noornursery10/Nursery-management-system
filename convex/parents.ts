import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("parents").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    relation: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("parents", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("parents"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    relation: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("parents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
