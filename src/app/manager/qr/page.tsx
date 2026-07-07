import { requireUser } from "@/lib/authz";
import StoreQr from "@/components/store-views/StoreQr";

export default async function ManagerQrPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요.</p>;
  return <StoreQr storeName={store.name} address={store.address} qrToken={store.qrToken} />;
}
