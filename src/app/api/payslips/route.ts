import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payslips, users } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";
import { uid } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) return NextResponse.json({ error: "employeeId가 필요해요." }, { status: 400 });

  if (session.role !== "admin" && employeeId !== session.userId) {
    if (session.role !== "manager") {
      return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    }
    const [target] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    if (!target || target.role !== "crew" || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원 명세서만 볼 수 있어요." }, { status: 403 });
    }
  }

  const rows = await db
    .select()
    .from(payslips)
    .where(eq(payslips.employeeId, employeeId))
    .orderBy(desc(payslips.issuedAt));

  return NextResponse.json({ payslips: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { employeeId, month, breakdown, grandTotal, note } = body ?? {};
  if (!employeeId || !month || !breakdown || typeof grandTotal !== "number") {
    return NextResponse.json({ error: "필수 항목이 비어있어요." }, { status: 400 });
  }

  const [employee] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
  if (!employee) return NextResponse.json({ error: "대상 직원을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    if (employee.role !== "crew" || employee.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원 명세서만 발급할 수 있어요." }, { status: 403 });
    }
  }

  const newPayslip = {
    id: uid("pay"),
    employeeId,
    employeeRole: employee.role,
    storeId: employee.storeId ?? null,
    month,
    breakdown,
    grandTotal: Math.round(grandTotal),
    note: note ?? null,
    issuedBy: session.userId,
  };

  await db.insert(payslips).values(newPayslip);
  return NextResponse.json({ payslip: newPayslip });
}
