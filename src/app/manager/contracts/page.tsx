import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireUser } from "@/lib/authz";
import ManagerContractsClient from "@/components/contracts/ManagerContractsClient";

export default async function ManagerContractsPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요.</p>;

  const crewRows = await db
    .select()
    .from(users)
    .where(and(eq(users.role, "crew"), eq(users.storeId, store.id)));

  const crewList = crewRows.map((u) => ({ id: u.id, name: u.name, hourlyWage: u.hourlyWage }));

  return (
    <ManagerContractsClient
      storeName={store.name}
      storeAddress={store.address}
      crewList={crewList}
    />
  );
}
