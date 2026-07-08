"use client";

import { useEffect, useState } from "react";
import ContractPreview from "@/components/contracts/ContractPreview";

type Contract = {
  id: string;
  status: string;
  [key: string]: unknown;
};

export default function MyContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [myName, setMyName] = useState("");
  const [storeName, setStoreName] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Contract | null>(null);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/me").then((r) => r.json());
      if (!me.user) return;
      setMyName(me.user.name);
      const [contractsRes, storeRes] = await Promise.all([
        fetch(`/api/contracts?employeeId=${me.user.id}`).then((r) => r.json()),
        fetch("/api/my-store").then((r) => r.json()),
      ]);
      setContracts(contractsRes.contracts ?? []);
      setStoreName(storeRes.store?.name ?? null);
    }
    load();
  }, []);

  function statusLabel(c: Contract) {
    if (c.status === "signed") return { label: "완료", color: "#3F6B4F" };
    return { label: "서명 대기", color: "#B8863B" };
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>내 근로계약서</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>매니저·관리자가 작성해준 계약서를 확인할 수 있어요.</p>

      {contracts.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm" style={{ color: "#8A9088" }}>아직 작성된 계약서가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => {
            const { label, color } = statusLabel(c);
            return (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#DDE1D8" }}>
                <div className="text-sm" style={{ color: "#1B2420" }}>
                  {c.startDate as string} 계약
                  <span className="ml-2 text-xs font-semibold" style={{ color }}>{label}</span>
                </div>
                <button onClick={() => setPreviewing(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#EEF0EA", color: "#1B2420" }}>보기</button>
              </div>
            );
          })}
        </div>
      )}

      {previewing && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <ContractPreview contract={previewing as any} employeeName={myName} storeName={storeName} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
