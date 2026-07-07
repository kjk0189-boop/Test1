import { requireUser } from "@/lib/authz";
import StoreCrew from "@/components/store-views/StoreCrew";

export default async function ManagerCrewPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요. 관리자에게 문의해주세요.</p>;
  return <StoreCrew storeId={store.id} />;
}
