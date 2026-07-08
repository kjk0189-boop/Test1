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
  position: text("position").default("신입"), // 크루 직책: 신입 | 일반 | 선임
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

export const contracts = pgTable("contracts", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  employeeRole: text("employee_role").notNull(), // 'crew' | 'manager'
  storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
  createdBy: text("created_by").notNull(), // 작성한 매니저/관리자 userId

  startDate: text("start_date").notNull(),
  noEndDate: boolean("no_end_date").notNull().default(true),
  endDate: text("end_date"),
  workplace: text("workplace"),
  jobDescription: text("job_description"),
  workDays: jsonb("work_days").notNull().default([1, 2, 3, 4, 5]), // 0=일 ... 6=토
  workStart: text("work_start"),
  workEnd: text("work_end"),
  breakMinutes: integer("break_minutes").default(60),

  // 크루: 시급 / 매니저: 고정 월급 + 추가 근무 시 시간당 추가수당
  hourlyWage: integer("hourly_wage"),
  baseSalary: integer("base_salary"),
  overtimeRate: integer("overtime_rate"),

  payDate: text("pay_date"),
  insurance: jsonb("insurance").notNull().default({ ei: true, ni: true, health: true, comp: true }),

  status: text("status").notNull().default("draft"), // draft | awaiting_signature | signed
  employerSignature: text("employer_signature"),
  employeeSignature: text("employee_signature"),
  signToken: text("sign_token"),
  signedAt: timestamp("signed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payslips = pgTable("payslips", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  employeeRole: text("employee_role").notNull(), // 'crew' | 'manager'
  storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
  month: text("month").notNull(), // YYYY-MM

  // 크루: 근태 기반 자동 계산 스냅샷 / 매니저: 고정급+추가수당
  breakdown: jsonb("breakdown").notNull(), // 화면에 그대로 보여줄 항목별 금액
  grandTotal: integer("grand_total").notNull(),
  note: text("note"),

  issuedBy: text("issued_by").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
});
