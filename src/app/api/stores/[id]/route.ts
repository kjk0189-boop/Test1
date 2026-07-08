import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  if (session.role === "manager" && session.storeId !== id) {
    return NextResponse.json({ error: "본인 지점만 수정할 수 있어요." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const patch: Partial<typeof stores.$inferInsert> = {};
  if (typeof body?.sealImage === "string" || body?.sealImage === null) patch.sealImage = body.sealImage;
  if (typeof body?.weeklyHolidayDow === "number") patch.weeklyHolidayDow = body.weeklyHolidayDow;
  if (session.role === "admin") {
    if (typeof body?.name === "string") patch.name = body.name;
    if (typeof body?.address === "string") patch.address = body.address;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없어요." }, { status: 400 });
  }

  await db.update(stores).set(patch).where(eq(stores.id, id));
  return NextResponse.json({ ok: true });
}
