import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import ContractListPanel from "@/components/contracts/ContractListPanel";

export default async function AdminManagerContractsPage() {
  const managerRows = await db.select().from(users).where(eq(users.role, "manager"));
  const managers = managerRows.map((u) => ({ id: u.id, name: u.name }));

  return <ContractListPanel employees={managers} payMode="salary" storeName="회사" />;
}
