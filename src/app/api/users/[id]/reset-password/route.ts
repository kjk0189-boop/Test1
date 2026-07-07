import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromCookies, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    if (target.role !== "crew" || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원만 초기화할 수 있어요." }, { status: 403 });
    }
  }

  const passwordHash = await hashPassword("0000");
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: true })
    .where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}
