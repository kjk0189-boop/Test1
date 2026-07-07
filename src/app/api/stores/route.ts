import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";
import { uid } from "@/lib/utils";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.role === "crew") {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const rows = await db.select().from(stores);
  return NextResponse.json({ stores: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 지점을 추가할 수 있어요." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const address = (body?.address ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "지점명을 입력해주세요." }, { status: 400 });
  }

  const newStore = {
    id: uid("store"),
    name,
    address,
    qrToken: `PUNCH-${uid("S").toUpperCase()}`,
    weeklyHolidayDow: 0,
    sealImage: null,
  };
  await db.insert(stores).values(newStore);

  return NextResponse.json({ store: newStore });
}
