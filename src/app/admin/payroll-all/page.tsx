"use client";

import { useEffect, useState } from "react";
import { computeMonthlyPayroll, durationLabel } from "@/lib/payroll";

type Store = { id: string; name: string; weeklyHolidayDow: number };
type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null };

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminPayrollAllPage() {
  const [month, setMonth] = useState(todayMonth());
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [storesRes, usersRes, attRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
        fetch(`/api/attendance?month=${month}`).then((r) => r.json()),
      ]);
      setStores(storesRes.stores ?? []);
      setUsers(usersRes.users ?? []);
      setAttendance(attRes.attendance ?? []);
    }
    load();
  }, [month]);

  const rows: { store: Store; crew: UserRow; grandTotal: number; netMin: number }[] = [];
  stores.forEach((store) => {
    const crewList = users.filter((u) => u.role === "crew" && u.storeId === store.id);
    crewList.forEach((crew) => {
      const crewRecords = attendance.filter((r) => r.userId === crew.id);
      const payroll = computeMonthlyPayroll(crewRecords, crew.hourlyWage ?? 0, store.weeklyHolidayDow ?? 0);
      rows.push({ store, crew, grandTotal: payroll.grandTotal, netMin: payroll.totals.netMin });
    });
  });
  const grandTotal = rows.reduce((s, r) => s + r.grandTotal, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>전 지점 급여</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>지점별 매니저·크루원 급여를 한 번에 확인해요.</p>

      <div className="rounded-xl border bg-white p-4 mb-5 flex items-center justify-between" style={{ borderColor: "#DDE1D8" }}>
        <span className="text-sm" style={{ color: "#5B6660" }}>{month} 전 지점 합계</span>
        <span className="text-xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{Math.round(grandTotal).toLocaleString()}원</span>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "520px" }}>
            <thead>
              <tr style={{ background: "#F7F8F5" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>지점</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>실지급액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ store, crew, grandTotal, netMin }) => (
                <tr key={crew.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                  <td className="px-4 py-3" style={{ color: "#5B6660" }}>{store.name}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{crew.name}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{durationLabel(netMin * 60000)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{grandTotal.toLocaleString()}원</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>해당 월 근무 기록이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
