"use client";

import { useEffect, useState } from "react";
import StoreDashboard from "@/components/store-views/StoreDashboard";
import StoreAttendance from "@/components/store-views/StoreAttendance";
import StoreCrew from "@/components/store-views/StoreCrew";
import StorePayroll from "@/components/store-views/StorePayroll";
import StoreQr from "@/components/store-views/StoreQr";
import StoreContracts from "@/components/contracts/StoreContracts";

type Store = { id: string; name: string; address: string | null; qrToken: string; weeklyHolidayDow: number; sealImage: string | null };

const TABS = [
  { key: "dashboard", label: "출근 현황" },
  { key: "attendance", label: "근태 관리" },
  { key: "crew", label: "크루원 관리" },
  { key: "contracts", label: "근로계약서" },
  { key: "payroll", label: "급여 관리" },
  { key: "qr", label: "매장 QR" },
] as const;

export default function AdminOperatePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("dashboard");

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((d) => {
      setStores(d.stores ?? []);
      if (d.stores?.[0]) setStoreId(d.stores[0].id);
    });
  }, []);

  const store = stores.find((s) => s.id === storeId);

  if (stores.length === 0) {
    return <p className="text-sm" style={{ color: "#8A9088" }}>등록된 지점이 없어요. 지점 관리에서 먼저 지점을 추가해주세요.</p>;
  }
  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>지점 운영</h2>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm font-semibold"
          style={{ borderColor: "#DDE1D8", color: "#1B2420" }}
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
            style={{ background: tab === t.key ? "#1B2420" : "#EEF0EA", color: tab === t.key ? "#F7F8F5" : "#5B6660" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <StoreDashboard storeId={store.id} storeName={store.name} />}
      {tab === "attendance" && <StoreAttendance storeId={store.id} />}
      {tab === "crew" && <StoreCrew storeId={store.id} />}
      {tab === "contracts" && <StoreContracts storeId={store.id} storeName={store.name} storeAddress={store.address} initialSealImage={store.sealImage} />}
      {tab === "payroll" && <StorePayroll storeId={store.id} storeName={store.name} holidayDow={store.weeklyHolidayDow ?? 0} />}
      {tab === "qr" && <StoreQr storeName={store.name} address={store.address} qrToken={store.qrToken} />}
    </div>
  );
}
