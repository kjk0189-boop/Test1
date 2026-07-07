import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { normalizePhone, verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(body?.phone ?? "");
  const password = body?.password ?? "";

  if (!phone) {
    return NextResponse.json({ error: "휴대폰번호를 입력해주세요." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "등록되지 않은 휴대폰번호예요. 매니저·관리자에게 계정 등록을 요청해주세요." },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role as "crew" | "manager" | "admin",
    storeId: user.storeId,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
    mustChangePassword: user.mustChangePassword,
  });
}
