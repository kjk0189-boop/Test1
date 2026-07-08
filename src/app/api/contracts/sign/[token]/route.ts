import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contracts, users, stores } from "@/lib/schema";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const [contract] = await db.select().from(contracts).where(eq(contracts.signToken, token)).limit(1);
  if (!contract) return NextResponse.json({ error: "유효하지 않은 링크예요." }, { status: 404 });

  const [employee] = await db.select().from(users).where(eq(users.id, contract.employeeId)).limit(1);
  const store = contract.storeId ? (await db.select().from(stores).where(eq(stores.id, contract.storeId)).limit(1))[0] : null;

  return NextResponse.json({
    contract,
    employeeName: employee?.name ?? "알 수 없음",
    storeName: store?.name ?? null,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const [contract] = await db.select().from(contracts).where(eq(contracts.signToken, token)).limit(1);
  if (!contract) return NextResponse.json({ error: "유효하지 않은 링크예요." }, { status: 404 });
  if (contract.status === "signed") {
    return NextResponse.json({ error: "이미 서명이 완료된 계약서예요." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.employeeSignature) {
    return NextResponse.json({ error: "서명을 입력해주세요." }, { status: 400 });
  }

  await db
    .update(contracts)
    .set({ employeeSignature: body.employeeSignature, status: "signed", signedAt: new Date() })
    .where(eq(contracts.id, contract.id));

  return NextResponse.json({ ok: true });
}
