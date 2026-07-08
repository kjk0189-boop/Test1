"use client";

import { useEffect, useState } from "react";
import { computeMonthlyPayroll, durationLabel } from "@/lib/payroll";

type Store = { id: string; name: string; weeklyHolidayDow: number };
type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null };
type Contract = { employeeId: string; baseSalary: number | null; status: string; createdAt: string };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayMonth() {
  return todayStr().slice(0, 7);
}
function monthsBetween(from: string, to: string) {
  const months = new Set<string>();
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    months.add(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months.size;
}

const MODES = [
  { key: "month", label: "월별" },
  { key: "range", label: "기간 조회" },
] as const;

export default function AdminPayrollAllPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("month");
  const [month, setMonth] = useState(todayMonth());
  const [fromDate, setFromDate] = useState(todayStr().slice(0, 8) + "01");
  const [toDate, setToDate] = useState(todayStr());
  const [storeFilter, setStoreFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "crew" | "manager">("");

  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((d) => setStores(d.stores ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, []);

  useEffect(() => {
    const from = mode === "month" ? `${month}-01` : fromDate;
    const to = mode === "month" ? `${month}-31` : toDate;
    fetch(`/api/attendance?from=${from}&to=${to}`).then((r) => r.json()).then((d) => setAttendance(d.attendance ?? []));
  }, [mode, month, fromDate, toDate]);

  useEffect(() => {
    // 전체 계약서(서명 완료된 것만) 가져와서 매니저 고정 월급 파악용으로 사용
    fetch(`/api/contracts?employeeRole=manager`).then((r) => r.json()).then((d) => {
      setContracts((d.contracts ?? []).filter((c: Contract) => c.status === "signed"));
    });
  }, []);

  const filteredStores = storeFilter ? stores.filter((s) => s.id === storeFilter) : stores;
  const showCrew = roleFilter === "" || roleFilter === "crew";
  const showManager = roleFilter === "" || roleFilter === "manager";
  const monthCount = mode === "month" ? 1 : monthsBetween(fromDate, toDate);

  const crewRows: { store: Store; user: UserRow; netMin: number; grandTotal: number }[] = [];
  if (showCrew) {
    filteredStores.forEach((store) => {
      const crewList = users.filter((u) => u.role === "crew" && u.storeId === store.id);
      crewList.forEach((crew) => {
        const crewRecords = attendance.filter((r) => r.userId === crew.id);
        const payroll = computeMonthlyPayroll(crewRecords, crew.hourlyWage ?? 0, store.weeklyHolidayDow ?? 0);
        crewRows.push({ store, user: crew, netMin: payroll.totals.netMin, grandTotal: payroll.grandTotal });
      });
    });
  }

  const managerRows: { store: Store | null; user: UserRow; grandTotal: number; hasContract: boolean }[] = [];
  if (showManager) {
    const managerPool = storeFilter ? users.filter((u) => u.role === "manager" && u.storeId === storeFilter) : users.filter((u) => u.role === "manager");
    managerPool.forEach((mgr) => {
      const contract = contracts.filter((c) => c.employeeId === mgr.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      const store = stores.find((s) => s.id === mgr.storeId) ?? null;
      const grandTotal = contract?.baseSalary ? contract.baseSalary * monthCount : 0;
      managerRows.push({ store, user: mgr, grandTotal, hasContract: !!contract?.baseSalary });
    });
  }

  const grandTotal = crewRows.reduce((s, r) => s + r.grandTotal, 0) + managerRows.reduce((s, r) => s + r.grandTotal, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>전 지점 급여</h2>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#DDE1D8" }}>
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="px-3 py-1.5 text-sm font-semibold"
              style={{ background: mode === m.key ? "#1B2420" : "#FFFFFF", color: mode === m.key ? "#F7F8F5" : "#5B6660" }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: "#5B6660" }}>지점별·직급별 급여를 한 번에 확인해요.</p>

      <div className="flex flex-wrap gap-2 mb-5">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
          <option value="">전체 지점</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "" | "crew" | "manager")} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
          <option value="">전체 직급</option>
          <option value="crew">크루</option>
          <option value="manager">매니저</option>
        </select>
        {mode === "month" ? (
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        ) : (
          <>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
            <span className="self-center text-sm" style={{ color: "#8A9088" }}>~</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
          </>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 mb-5 flex items-center justify-between" style={{ borderColor: "#DDE1D8" }}>
        <span className="text-sm" style={{ color: "#5B6660" }}>{mode === "month" ? month : `${fromDate} ~ ${toDate}`} 합계</span>
        <span className="text-xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{Math.round(grandTotal).toLocaleString()}원</span>
      </div>

      {showCrew && (
        <>
          <div className="text-sm font-semibold mb-2" style={{ color: "#5B6660" }}>크루원 (근태 기반 자동 계산)</div>
          <div className="rounded-xl border bg-white overflow-hidden mb-6" style={{ borderColor: "#DDE1D8" }}>
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
                  {crewRows.map(({ store, user, netMin, grandTotal }) => (
                    <tr key={user.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                      <td className="px-4 py-3" style={{ color: "#5B6660" }}>{store.name}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{user.name}</td>
                      <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{durationLabel(netMin * 60000)}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(grandTotal).toLocaleString()}원</td>
                    </tr>
                  ))}
                  {crewRows.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#8A9088" }}>해당 조건의 근무 기록이 없어요.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showManager && (
        <>
          <div className="text-sm font-semibold mb-2" style={{ color: "#5B6660" }}>매니저 (계약서상 고정 월급 기준 추정치)</div>
          <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "520px" }}>
                <thead>
                  <tr style={{ background: "#F7F8F5" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>지점</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>매니저</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>추정 급여</th>
                  </tr>
                </thead>
                <tbody>
                  {managerRows.map(({ store, user, grandTotal, hasContract }) => (
                    <tr key={user.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                      <td className="px-4 py-3" style={{ color: "#5B6660" }}>{store?.name ?? "지점 미지정"}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{user.name}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                        {hasContract ? `${Math.round(grandTotal).toLocaleString()}원` : "계약서 없음"}
                      </td>
                    </tr>
                  ))}
                  {managerRows.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-sm" style={{ color: "#8A9088" }}>등록된 매니저가 없어요.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "#8A9088" }}>
            매니저 급여는 실제 출퇴근 기록이 없어서, 서명 완료된 근로계약서의 고정 월급 × 조회 기간 내 개월 수로 추정한 값이에요. 추가 근무 수당은 "매니저 급여명세서"에서 직접 발급한 내역을 확인해주세요.
          </p>
        </>
      )}
    </div>
  );
}
