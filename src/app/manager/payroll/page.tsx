"use client";

import { useEffect, useState } from "react";
import StorePayroll from "@/components/store-views/StorePayroll";

export default function ManagerPayrollPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [holidayDow, setHolidayDow] = useState(0);

  useEffect(() => {
    fetch("/api/my-store").then((r) => r.json()).then((d) => {
      setStoreId(d.store?.id ?? null);
      setHolidayDow(d.store?.weeklyHolidayDow ?? 0);
    });
  }, []);

  if (!storeId) return <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>;
  return <StorePayroll storeId={storeId} holidayDow={holidayDow} />;
}
