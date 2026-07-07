import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromCookies, normalizePhone, hashPassword } from "@/lib/auth";
import { uid } from "@/lib/utils";

function sanitize(u: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const rows = await db.select().from(users);
  return NextResponse.json({ users: rows.map(sanitize) });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const role = body?.role; // 'crew' | 'manager'
  const name = (body?.name ?? "").trim();
  const phone = normalizePhone(body?.phone ?? "");
  const storeId = body?.storeId;

  if (role !== "crew" && role !== "manager") {
    return NextResponse.json({ error: "역할이 올바르지 않아요." }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "연락처(로그인 아이디)를 입력해주세요." }, { status: 400 });
  if (!storeId) return NextResponse.json({ error: "소속 지점을 선택해주세요." }, { status: 400 });

  // 매니저는 본인 지점의 크루원만 등록 가능
  if (session.role === "manager") {
    if (role !== "crew" || storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원만 등록할 수 있어요." }, { status: 403 });
    }
  }

  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 연락처예요." }, { status: 409 });
  }

  const passwordHash = await hashPassword("0000");
  const newUser = {
    id: uid("u"),
    name,
    role,
    storeId,
    phone,
    passwordHash,
    mustChangePassword: true,
    hourlyWage: role === "crew" ? Number(body?.hourlyWage ?? 10030) : null,
    hireDate: role === "crew" ? (body?.hireDate ?? null) : null,
    active: true,
  };

  await db.insert(users).values(newUser);
  const { passwordHash: _omit, ...safeUser } = newUser;
  return NextResponse.json({ user: safeUser });
}
