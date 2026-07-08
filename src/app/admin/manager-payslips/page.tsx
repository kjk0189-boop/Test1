import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import AdminManagerPayslipsClient from "@/components/AdminManagerPayslipsClient";

export default async function AdminManagerPayslipsPage() {
  const managerRows = await db.select().from(users).where(eq(users.role, "manager"));
  const storeRows = await db.select().from(stores);
  const storeMap = Object.fromEntries(storeRows.map((s) => [s.id, s.name]));

  const managers = managerRows.map((m) => ({
    id: m.id,
    name: m.name,
    storeName: m.storeId ? storeMap[m.storeId] ?? null : null,
  }));

  return <AdminManagerPayslipsClient managers={managers} />;
}
