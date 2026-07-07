import { NextRequest, NextResponse } from "next/server";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendanceRecords, users } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";
import { uid } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const userId = searchParams.get("userId");
  const month = searchParams.get("month"); // YYYY-MM
  const date = searchParams.get("date"); // YYYY-MM-DD

  const conditions = [];
  if (session.role === "crew") {
    conditions.push(eq(attendanceRecords.userId, session.userId));
  } else if (userId) {
    conditions.push(eq(attendanceRecords.userId, userId));
  }
  if (storeId) conditions.push(eq(attendanceRecords.storeId, storeId));
  if (date) conditions.push(eq(attendanceRecords.date, date));
  if (month) conditions.push(like(attendanceRecords.date, `${month}%`));

  const rows = await db
    .select()
    .from(attendanceRecords)
    .where(conditions.length ? and(...conditions) : undefined);

  return NextResponse.json({ attendance: rows });
}

// 매니저/관리자가 특정 날짜 기록이 아예 없을 때 수동으로 새로 등록
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { userId, date, checkIn, checkOut, reason } = body ?? {};
  if (!userId || !date || (!checkIn && !checkOut)) {
    return NextResponse.json({ error: "필수 항목이 비어있어요." }, { status: 400 });
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "수정 사유를 입력해주세요." }, { status: 400 });
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return NextResponse.json({ error: "대상 크루원을 찾을 수 없어요." }, { status: 404 });

  if (session.role === "manager" && target.storeId !== session.storeId) {
    return NextResponse.json({ error: "본인 지점의 크루원만 등록할 수 있어요." }, { status: 403 });
  }

  const logEntry = {
    editedBy: session.userId,
    editedAt: Date.now(),
    oldCheckIn: null,
    newCheckIn: checkIn ?? null,
    oldCheckOut: null,
    newCheckOut: checkOut ?? null,
    reason,
  };

  const newRecord = {
    id: uid("att"),
    userId,
    storeId: target.storeId!,
    date,
    checkIn: checkIn ? new Date(checkIn) : null,
    checkOut: checkOut ? new Date(checkOut) : null,
    method: "수동입력",
    editLog: [logEntry],
  };

  await db.insert(attendanceRecords).values(newRecord);
  return NextResponse.json({ record: newRecord });
}
