import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
    role: v.optional(v.string()), // admin / manager
    active: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // الأطفال
  children: defineTable({
    name: v.string(),
    birthDate: v.string(),
    gender: v.string(),
    className: v.string(),
    parentId: v.id("parents"),
    notes: v.optional(v.string()),
    active: v.boolean(),
    image: v.optional(v.string()),
    enrollmentDate: v.optional(v.string()),
    teacherId: v.optional(v.id("staff")),
    address: v.optional(v.string()),
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
  })
    .index("by_parent", ["parentId"])
    .index("by_class", ["className"]),

  // أولياء الأمور
  parents: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    relation: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_phone", ["phone"]),

  // الموظفون والمدرسون
  staff: defineTable({
    name: v.string(),
    role: v.string(), // مدرس / موظف / إدارة
    phone: v.string(),
    email: v.optional(v.string()),
    salary: v.number(),
    hireDate: v.string(),
    active: v.boolean(),
  })
    .index("by_role", ["role"]),

  // سجلات الحضور والانصراف
  attendance: defineTable({
    personType: v.string(), // child / staff
    personId: v.string(),
    date: v.string(), // YYYY-MM-DD
    status: v.string(), // present / absent / late / leave
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_person_date", ["personId", "date"])
    .index("by_date", ["date"]),

  // الرسوم الشهرية
  fees: defineTable({
    childId: v.id("children"),
    feeType: v.optional(v.string()), // نوع الرسوم
    month: v.string(), // YYYY-MM
    amount: v.number(),
    discount: v.optional(v.number()), // الخصم
    paid: v.number(),
    status: v.string(), // unpaid / partial / paid
    notes: v.optional(v.string()),
  })
    .index("by_child", ["childId"])
    .index("by_month", ["month"]),

  // المدفوعات
  payments: defineTable({
    childId: v.id("children"),
    feeId: v.optional(v.id("fees")),
    amount: v.number(),
    date: v.string(),
    method: v.string(), // cash / card / transfer
    notes: v.optional(v.string()),
    receiptNumber: v.optional(v.string()), // رقم الإيصال المتسلسل
    staffName: v.optional(v.string()), // اسم الموظف الذي سجل الدفعة
  })
    .index("by_child", ["childId"])
    .index("by_date", ["date"])
    .index("by_receipt", ["receiptNumber"]),

  // المصروفات
  expenses: defineTable({
    title: v.string(),
    category: v.string(),
    amount: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    staffName: v.optional(v.string()),
  })
    .index("by_date", ["date"]),

  // إعدادات الحضانة
  settings: defineTable({
    name: v.string(),
    logo: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  }),

  // الإيصالات الموحدة
  receipts: defineTable({
    receiptNumber: v.string(), // رقم الإيصال المتسلسل الموحد
    type: v.string(), // fee / payment / expense
    childId: v.optional(v.id("children")),
    feeId: v.optional(v.id("fees")),
    paymentId: v.optional(v.id("payments")),
    expenseId: v.optional(v.id("expenses")),
    amount: v.number(), // المبلغ الأساسي
    discount: v.optional(v.number()), // الخصم
    paid: v.optional(v.number()), // المدفوع
    remaining: v.optional(v.number()), // المتبقي
    method: v.optional(v.string()), // طريقة الدفع
    description: v.optional(v.string()), // وصف المصروف / نوع الرسوم
    month: v.optional(v.string()), // الفترة
    staffName: v.optional(v.string()), // الموظف
    createdAt: v.number(), // وقت الإنشاء (timestamp)
  })
    .index("by_receiptNumber", ["receiptNumber"])
    .index("by_createdAt", ["createdAt"]),
});
