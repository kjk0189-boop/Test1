"use client";

import { useEffect, useState } from "react";
import StoreDashboard from "@/components/store-views/StoreDashboard";

export default function ManagerDashboardPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    fetch("/api/my-store").then((r) => r.json()).then((d) => {
      setStoreId(d.store?.id ?? null);
      setStoreName(d.store?.name ?? "");
    });
  }, []);

  if (!storeId) return <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>;
  return <StoreDashboard storeId={storeId} storeName={storeName} />;
}
