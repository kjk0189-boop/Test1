import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  return NextResponse.json({ sealImage: admin?.sealImage ?? null });
}
