"use client";

import { useEffect, useState } from "react";
import PayslipView from "@/components/PayslipView";

type Payslip = {
  id: string;
  month: string;
  breakdown: { label: string; value: number }[];
  grandTotal: number;
  note: string | null;
};

export default function MyPayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [myName, setMyName] = useState("");
  const [storeName, setStoreName] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Payslip | null>(null);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/me").then((r) => r.json());
      if (!me.user) return;
      setMyName(me.user.name);
      const [payslipsRes, storeRes] = await Promise.all([
        fetch(`/api/payslips?employeeId=${me.user.id}`).then((r) => r.json()),
        fetch("/api/my-store").then((r) => r.json()),
      ]);
      setPayslips(payslipsRes.payslips ?? []);
      setStoreName(storeRes.store?.name ?? null);
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>내 급여명세서</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>매니저·관리자가 발급한 급여명세서를 확인할 수 있어요.</p>

      {payslips.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm" style={{ color: "#8A9088" }}>아직 발급된 명세서가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payslips.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#DDE1D8" }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>{p.month}</div>
                <div className="text-xs" style={{ color: "#8A9088" }}>실지급액 {p.grandTotal.toLocaleString()}원</div>
              </div>
              <button onClick={() => setViewing(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#EEF0EA", color: "#1B2420" }}>보기</button>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <PayslipView
          employeeName={myName}
          storeName={storeName}
          month={viewing.month}
          items={viewing.breakdown}
          grandTotal={viewing.grandTotal}
          note={viewing.note}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
