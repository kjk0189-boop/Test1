"use client";

import { useEffect, useState } from "react";
import PayslipView from "@/components/PayslipView";

type Manager = { id: string; name: string; storeName: string | null };
type Contract = { baseSalary: number | null; overtimeRate: number | null; status: string };

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminManagerPayslipsClient({ managers }: { managers: Manager[] }) {
  const [month, setMonth] = useState(todayMonth());
  const [contracts, setContracts] = useState<Record<string, Contract | null>>({});
  const [extraPay, setExtraPay] = useState<Record<string, number>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [issuing, setIssuing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ manager: Manager; items: { label: string; value: number }[]; grandTotal: number; note: string } | null>(null);

  useEffect(() => {
    async function load() {
      const entries = await Promise.all(
        managers.map(async (m) => {
          const res = await fetch(`/api/contracts?employeeId=${m.id}`).then((r) => r.json());
          return [m.id, res.contracts?.[0] ?? null] as const;
        })
      );
      setContracts(Object.fromEntries(entries));
    }
    if (managers.length > 0) load();
  }, [managers]);

  async function handleIssue(manager: Manager) {
    const contract = contracts[manager.id];
    const baseSalary = contract?.baseSalary ?? 0;
    const extra = extraPay[manager.id] ?? 0;
    const noteVal = note[manager.id] ?? "";
    const items = [
      { label: "고정 월급", value: baseSalary },
      { label: "추가 근무 수당", value: extra },
    ];
    const grandTotal = baseSalary + extra;

    setIssuing(manager.id);
    try {
      await fetch("/api/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: manager.id, month, breakdown: items, grandTotal, note: noteVal || null }),
      });
      setViewing({ manager, items, grandTotal, note: noteVal });
    } finally {
      setIssuing(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>매니저 급여명세서</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>계약서에 명시된 고정 월급 기준이고, 추가 근무 수당은 직접 입력해서 더해줘요.</p>

      <div className="space-y-3">
        {managers.map((m) => {
          const contract = contracts[m.id];
          const hasSalary = contract?.baseSalary != null;
          return (
            <div key={m.id} className="rounded-xl border bg-white p-4" style={{ borderColor: "#DDE1D8" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ color: "#1B2420" }}>{m.name}</div>
                  <div className="text-xs" style={{ color: "#8A9088" }}>{m.storeName ?? "지점 미지정"}</div>
                </div>
                <div className="text-sm font-mono" style={{ color: "#1B2420" }}>
                  {hasSalary ? `고정 월급 ${contract!.baseSalary!.toLocaleString()}원` : "계약서에 월급 정보 없음"}
                </div>
              </div>
              {!hasSalary ? (
                <p className="text-xs" style={{ color: "#A64B3A" }}>먼저 "매니저 계약서"에서 근로계약서를 작성해주세요.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>추가 근무 수당(원)</label>
                    <input
                      type="number"
                      value={extraPay[m.id] ?? 0}
                      onChange={(e) => setExtraPay({ ...extraPay, [m.id]: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>비고</label>
                    <input
                      value={note[m.id] ?? ""}
                      onChange={(e) => setNote({ ...note, [m.id]: e.target.value })}
                      placeholder="예: 주말 추가근무 8시간"
                      className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "#DDE1D8" }}
                    />
                  </div>
                  <button
                    onClick={() => handleIssue(m)}
                    disabled={issuing === m.id}
                    className="py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#1B2420", color: "#F7F8F5" }}
                  >
                    {issuing === m.id ? "발급 중..." : "발급"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {managers.length === 0 && <p className="text-sm" style={{ color: "#8A9088" }}>등록된 매니저가 없어요.</p>}
      </div>

      {viewing && (
        <PayslipView
          employeeName={viewing.manager.name}
          storeName={viewing.manager.storeName}
          month={month}
          items={viewing.items}
          grandTotal={viewing.grandTotal}
          note={viewing.note}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
