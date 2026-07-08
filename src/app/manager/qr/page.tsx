import { requireUser } from "@/lib/authz";
import StoreQr from "@/components/store-views/StoreQr";
import StoreLocationSettings from "@/components/store-views/StoreLocationSettings";

export default async function ManagerQrPage() {
  const { store } = await requireUser("manager");
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>소속 지점 정보를 찾을 수 없어요.</p>;
  return (
    <div className="max-w-xl space-y-6">
      <StoreQr storeName={store.name} address={store.address} qrToken={store.qrToken} />
      <StoreLocationSettings
        storeId={store.id}
        initialLatitude={store.latitude}
        initialLongitude={store.longitude}
        initialRadius={store.radiusMeters}
      />
    </div>
  );
}
