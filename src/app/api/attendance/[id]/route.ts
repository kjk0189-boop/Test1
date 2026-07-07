import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendanceRecords, users } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).limit(1);
  if (!record) return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager") {
    const [target] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1);
    if (!target || target.storeId !== session.storeId) {
      return NextResponse.json({ error: "본인 지점의 기록만 수정할 수 있어요." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const { checkIn, checkOut, reason } = body ?? {};
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "수정 사유를 입력해주세요." }, { status: 400 });
  }

  const newCheckIn = checkIn ? new Date(checkIn) : null;
  const newCheckOut = checkOut ? new Date(checkOut) : null;

  const logEntry = {
    editedBy: session.userId,
    editedAt: Date.now(),
    oldCheckIn: record.checkIn ? record.checkIn.toISOString() : null,
    newCheckIn: newCheckIn ? newCheckIn.toISOString() : null,
    oldCheckOut: record.checkOut ? record.checkOut.toISOString() : null,
    newCheckOut: newCheckOut ? newCheckOut.toISOString() : null,
    reason,
  };

  const existingLog = Array.isArray(record.editLog) ? record.editLog : [];

  await db
    .update(attendanceRecords)
    .set({
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      editLog: [...existingLog, logEntry],
    })
    .where(eq(attendanceRecords.id, id));

  return NextResponse.json({ ok: true });
}
