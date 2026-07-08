"use client";

import { useEffect, useState } from "react";
import ContractListPanel from "@/components/contracts/ContractListPanel";

type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };

export default function StoreContracts({
  storeId,
  storeName,
  storeAddress,
}: {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
}) {
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [sealImage, setSealImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company-seal").then((r) => r.json()).then((d) => setSealImage(d.sealImage ?? null));
  }, []);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      setCrewList((d.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
    });
  }, [storeId]);

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border bg-white p-4 mb-6 flex items-center gap-3" style={{ borderColor: "#DDE1D8" }}>
        {sealImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sealImage} alt="회사 인감" className="w-14 h-14 object-contain rounded-lg border p-1" style={{ borderColor: "#DDE1D8" }} />
        ) : (
          <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: "#EEF0EA" }}>
            <span style={{ color: "#8A9088" }}>?</span>
          </div>
        )}
        <div>
          <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>회사 인감</div>
          <div className="text-xs" style={{ color: "#8A9088" }}>
            {sealImage ? "등록됨 · 계약서 서명 시 자동으로 사용돼요" : "아직 등록 안 됨 · 매니저 관리에서 등록해주세요"}
          </div>
        </div>
      </div>
      <ContractListPanel
        employees={crewList}
        payMode="hourly"
        sealImage={sealImage}
        defaultWorkplace={storeAddress ?? ""}
        storeName={storeName}
      />
    </div>
  );
}
