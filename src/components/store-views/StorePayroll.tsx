"use client";

import { useEffect, useState } from "react";
import { computeMonthlyPayroll, durationLabel } from "@/lib/payroll";

type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null };

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StorePayroll({ storeId, holidayDow }: { storeId: string; holidayDow: number }) {
  const [month, setMonth] = useState(todayMonth());
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [usersRes, attRes] = await Promise.all([
        fetch("/api/users").then((r) => r.json()),
        fetch(`/api/attendance?storeId=${storeId}&month=${month}`).then((r) => r.json()),
      ]);
      setCrewList((usersRes.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
      setRecords(attRes.attendance ?? []);
    }
    load();
  }, [storeId, month]);

  const rows = crewList.map((crew) => {
    const crewRecords = records.filter((r) => r.userId === crew.id);
    const payroll = computeMonthlyPayroll(crewRecords, crew.hourlyWage ?? 0, holidayDow);
    return { crew, payroll };
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>급여 관리</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>근태 기록을 바탕으로 연장·야간·주휴수당까지 자동 계산해요.</p>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "640px" }}>
            <thead>
              <tr style={{ background: "#F7F8F5" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>기본급+연장</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>야간</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>주휴</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>실지급액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ crew, payroll }) => (
                <tr key={crew.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{crew.name}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{durationLabel(payroll.totals.netMin * 60000)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.totals.basePay).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.totals.nightPay).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.weeklyAllowanceTotal).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: "var(--font-mono)", color: "#1B2420" }}>{payroll.grandTotal.toLocaleString()}원</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs mt-4" style={{ color: "#8A9088" }}>
        연장(1일 8시간 초과 ×1.5) · 야간(22:00~06:00 ×0.5 가산) · 휴일근로(주휴일 근무 ×1.5, 8시간 초과 ×2.0) · 주휴수당(주 15시간↑ 근무 시)을 자동 반영한 추정치예요. 4대보험 공제는 포함되지 않았고, 명세서 발급/저장 기능은 아직 없어요.
      </p>
    </div>
  );
}
