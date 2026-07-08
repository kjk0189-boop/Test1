import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendanceRecords, users, stores } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";
import { uid, todayStr } from "@/lib/utils";
import { distanceMeters } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role !== "crew") return NextResponse.json({ error: "크루원만 사용할 수 있어요." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const qrToken = body?.qrToken;
  const latitude = typeof body?.latitude === "number" ? body.latitude : null;
  const longitude = typeof body?.longitude === "number" ? body.longitude : null;

  const [me] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!me || !me.storeId) {
    return NextResponse.json({ error: "소속 지점 정보를 찾을 수 없어요." }, { status: 400 });
  }

  const [store] = await db.select().from(stores).where(eq(stores.id, me.storeId)).limit(1);
  if (!store) return NextResponse.json({ error: "지점 정보를 찾을 수 없어요." }, { status: 404 });

  if (qrToken !== store.qrToken) {
    return NextResponse.json({ error: "매장 QR이 아니에요. 다시 시도해주세요." }, { status: 400 });
  }

  // 매장에 좌표가 등록되어 있으면 위치 정보 제공이 필수 (거부 시 차단)
  const locationRequired = store.latitude != null && store.longitude != null;
  if (locationRequired && (latitude == null || longitude == null)) {
    return NextResponse.json(
      { error: "위치 정보를 허용해야 출퇴근할 수 있어요. 브라우저 위치 권한을 확인해주세요." },
      { status: 400 }
    );
  }

  let distance: number | null = null;
  if (locationRequired && latitude != null && longitude != null) {
    distance = distanceMeters(latitude, longitude, store.latitude!, store.longitude!);
  }

  const date = todayStr();
  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, session.userId), eq(attendanceRecords.date, date)))
    .limit(1);

  const now = new Date();

  if (!existing) {
    const newRecord = {
      id: uid("att"),
      userId: session.userId,
      storeId: store.id,
      date,
      checkIn: now,
      checkOut: null,
      method: "QR",
      checkInDistance: distance,
      checkOutDistance: null,
      editLog: [],
    };
    await db.insert(attendanceRecords).values(newRecord);
    return NextResponse.json({ status: "checked-in", record: newRecord, flagged: distance != null && distance > store.radiusMeters });
  }

  if (existing.checkIn && !existing.checkOut) {
    await db
      .update(attendanceRecords)
      .set({ checkOut: now, checkOutDistance: distance })
      .where(eq(attendanceRecords.id, existing.id));
    return NextResponse.json({
      status: "checked-out",
      record: { ...existing, checkOut: now, checkOutDistance: distance },
      flagged: distance != null && distance > store.radiusMeters,
    });
  }

  return NextResponse.json({ error: "오늘은 이미 출퇴근을 마쳤어요." }, { status: 400 });
}
