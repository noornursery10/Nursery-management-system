import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("children").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    birthDate: v.string(),
    gender: v.string(),
    className: v.string(),
    parentId: v.id("parents"),
    notes: v.optional(v.string()),
    image: v.optional(v.string()),
    enrollmentDate: v.optional(v.string()),
    teacherId: v.optional(v.id("staff")),
    address: v.optional(v.string()),
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("children", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("children"),
    name: v.string(),
    birthDate: v.string(),
    gender: v.string(),
    className: v.string(),
    parentId: v.id("parents"),
    notes: v.optional(v.string()),
    image: v.optional(v.string()),
    enrollmentDate: v.optional(v.string()),
    teacherId: v.optional(v.id("staff")),
    address: v.optional(v.string()),
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("children") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
