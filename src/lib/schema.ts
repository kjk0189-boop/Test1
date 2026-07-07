import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const stores = pgTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  qrToken: text("qr_token").notNull(),
  weeklyHolidayDow: integer("weekly_holiday_dow").notNull().default(0),
  sealImage: text("seal_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'crew' | 'manager' | 'admin'
  storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  hourlyWage: integer("hourly_wage"),
  hireDate: text("hire_date"), // YYYY-MM-DD
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  checkIn: timestamp("check_in", { withTimezone: true }),
  checkOut: timestamp("check_out", { withTimezone: true }),
  method: text("method").default("QR"),
  // [{ editedBy, editedAt, oldCheckIn, newCheckIn, oldCheckOut, newCheckOut, reason }]
  editLog: jsonb("edit_log").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
