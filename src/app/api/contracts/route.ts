import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contracts, users } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";
import { uid } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");

  // employeeId가 없으면 관리자 전용 "전체 계약서" 조회 (지점/직급/기간 필터 지원)
  if (!employeeId) {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    }
    const storeId = searchParams.get("storeId");
    const employeeRole = searchParams.get("employeeRole"); // 'crew' | 'manager'
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];
    if (storeId) conditions.push(eq(contracts.storeId, storeId));
    if (employeeRole) conditions.push(eq(contracts.employeeRole, employeeRole));
    if (from) conditions.push(gte(contracts.startDate, from));
    if (to) conditions.push(lte(contracts.startDate, to));

    const rows = await db
      .select()
      .from(contracts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(contracts.createdAt));

    return NextResponse.json({ contracts: rows });
  }

  if (session.role !== "admin" && employeeId !== session.userId) {
    if (session.role !== "manager") {
      return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    }
    const [target] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    if (!target || target.role !== "crew" || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원 계약서만 볼 수 있어요." }, { status: 403 });
    }
  }

  const rows = await db
    .select()
    .from(contracts)
    .where(eq(contracts.employeeId, employeeId))
    .orderBy(desc(contracts.createdAt));

  return NextResponse.json({ contracts: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const employeeId = body?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "대상 직원을 지정해주세요." }, { status: 400 });

  const [employee] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
  if (!employee) return NextResponse.json({ error: "대상 직원을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    if (employee.role !== "crew" || employee.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원 계약서만 작성할 수 있어요." }, { status: 403 });
    }
  }

  if (!body.employerSignature) {
    return NextResponse.json({ error: "사업주(고용주) 서명이 필요해요." }, { status: 400 });
  }
  if (!body.startDate) {
    return NextResponse.json({ error: "계약 시작일을 입력해주세요." }, { status: 400 });
  }

  const newContract = {
    id: uid("ctr"),
    employeeId,
    employeeRole: employee.role,
    storeId: employee.storeId ?? null,
    createdBy: session.userId,
    startDate: body.startDate,
    noEndDate: body.noEndDate !== false,
    endDate: body.noEndDate === false ? body.endDate ?? null : null,
    workplace: body.workplace ?? null,
    jobDescription: body.jobDescription ?? null,
    workDays: Array.isArray(body.workDays) ? body.workDays : [1, 2, 3, 4, 5],
    workStart: body.workStart ?? null,
    workEnd: body.workEnd ?? null,
    breakMinutes: typeof body.breakMinutes === "number" ? body.breakMinutes : 60,
    hourlyWage: employee.role === "crew" ? (body.hourlyWage ?? employee.hourlyWage ?? null) : null,
    baseSalary: employee.role === "manager" ? (body.baseSalary ?? null) : null,
    overtimeRate: employee.role === "manager" ? (body.overtimeRate ?? null) : null,
    payDate: body.payDate ?? null,
    insurance: body.insurance ?? { ei: true, ni: true, health: true, comp: true },
    status: "awaiting_signature" as const,
    employerSignature: body.employerSignature,
    employeeSignature: null,
    signToken: uid("sign"),
    signedAt: null,
  };

  await db.insert(contracts).values(newContract);
  return NextResponse.json({ contract: newContract });
}
