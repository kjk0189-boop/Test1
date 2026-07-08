import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromCookies, normalizePhone } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    if (target.role !== "crew" || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원만 수정할 수 있어요." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const patch: Partial<typeof users.$inferInsert> = {};

  if (typeof body?.name === "string") patch.name = body.name.trim();
  if (typeof body?.phone === "string") {
    const normalized = normalizePhone(body.phone);
    if (normalized && normalized !== target.phone) {
      const [dup] = await db.select().from(users).where(eq(users.phone, normalized)).limit(1);
      if (dup) return NextResponse.json({ error: "이미 사용 중인 연락처예요." }, { status: 409 });
      patch.phone = normalized;
    }
  }
  if (typeof body?.hourlyWage === "number") patch.hourlyWage = body.hourlyWage;
  if (typeof body?.hireDate === "string") patch.hireDate = body.hireDate;
  if (typeof body?.position === "string") patch.position = body.position;
  if (typeof body?.active === "boolean") patch.active = body.active;
  if (typeof body?.sealImage === "string" || body?.sealImage === null) {
    if (session.userId !== id) {
      return NextResponse.json({ error: "본인 인감만 수정할 수 있어요." }, { status: 403 });
    }
    patch.sealImage = body.sealImage;
  }
  if (typeof body?.storeId === "string" && session.role === "admin") patch.storeId = body.storeId;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없어요." }, { status: 400 });
  }

  await db.update(users).set(patch).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    if (target.role !== "crew" || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 크루원만 삭제할 수 있어요." }, { status: 403 });
    }
  }

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
