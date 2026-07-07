import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const [me] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!me?.storeId) return NextResponse.json({ store: null });

  const [store] = await db.select().from(stores).where(eq(stores.id, me.storeId)).limit(1);
  return NextResponse.json({ store: store ?? null });
}
