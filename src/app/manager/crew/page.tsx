"use client";

import { useEffect, useState } from "react";
import StoreCrew from "@/components/store-views/StoreCrew";

export default function ManagerCrewPage() {
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-store").then((r) => r.json()).then((d) => setStoreId(d.store?.id ?? null));
  }, []);

  if (!storeId) return <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>;
  return <StoreCrew storeId={storeId} />;
}
