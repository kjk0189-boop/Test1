import { requireUser } from "@/lib/authz";
import StoreDashboard from "@/components/store-views/StoreDashboard";

export default async function ManagerDashboardPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요. 관리자에게 문의해주세요.</p>;
  return <StoreDashboard storeId={store.id} storeName={store.name} />;
}
