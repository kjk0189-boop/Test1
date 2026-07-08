import { requireUser } from "@/lib/authz";
import StorePayroll from "@/components/store-views/StorePayroll";

export default async function ManagerPayrollPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요. 관리자에게 문의해주세요.</p>;
  return <StorePayroll storeId={store.id} storeName={store.name} holidayDow={store.weeklyHolidayDow ?? 0} />;
}
