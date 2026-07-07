import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromCookies, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword ?? "";
  const newPassword = body?.newPassword ?? "";

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "새 비밀번호는 4자리 이상으로 설정해주세요." }, { status: 400 });
  }
  if (newPassword === "0000") {
    return NextResponse.json({ error: "초기 비밀번호와 다른 값으로 설정해주세요." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "계정을 찾을 수 없어요." }, { status: 404 });
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
