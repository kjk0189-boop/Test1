"use client";

import { useEffect, useState, Fragment } from "react";
import { computeMonthlyPayroll, analyzeShift, payForShift, durationLabel } from "@/lib/payroll";
import PayslipView from "@/components/PayslipView";

type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayMonth() {
  return todayStr().slice(0, 7);
}

const MODES = [
  { key: "day", label: "일자별" },
  { key: "month", label: "월별" },
  { key: "range", label: "기간 조회" },
] as const;

export default function StorePayroll({ storeId, storeName, holidayDow }: { storeId: string; storeName?: string; holidayDow: number }) {
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("month");
  const [day, setDay] = useState(todayStr());
  const [month, setMonth] = useState(todayMonth());
  const [fromDate, setFromDate] = useState(todayStr().slice(0, 8) + "01");
  const [toDate, setToDate] = useState(todayStr());

  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ crew: UserRow; items: { label: string; value: number }[]; grandTotal: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function loadCrew() {
      const usersRes = await fetch("/api/users").then((r) => r.json());
      setCrewList((usersRes.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
    }
    loadCrew();
  }, [storeId]);

  useEffect(() => {
    async function loadAttendance() {
      let url = "";
      if (mode === "day") url = `/api/attendance?storeId=${storeId}&date=${day}`;
      else if (mode === "month") url = `/api/attendance?storeId=${storeId}&month=${month}`;
      else url = `/api/attendance?storeId=${storeId}&from=${fromDate}&to=${toDate}`;
      const res = await fetch(url).then((r) => r.json());
      setRecords(res.attendance ?? []);
    }
    loadAttendance();
  }, [storeId, mode, day, month, fromDate, toDate]);

  // 월별 / 기간 조회 계산 (근무기록 전체를 넣으면 자동으로 주휴수당까지 계산됨)
  const payrollRows = crewList.map((crew) => {
    const crewRecords = records.filter((r) => r.userId === crew.id);
    const payroll = computeMonthlyPayroll(crewRecords, crew.hourlyWage ?? 0, holidayDow);
    return { crew, payroll };
  });

  // 일자별 계산 (그 날 하루치 근무만, 주휴수당은 미포함)
  const dayRows = crewList.map((crew) => {
    const rec = records.find((r) => r.userId === crew.id && r.checkIn && r.checkOut);
    if (!rec) return { crew, netMin: 0, basePay: 0, nightPay: 0, total: 0 };
    const shift = analyzeShift(rec.date, new Date(rec.checkIn!).getTime(), new Date(rec.checkOut!).getTime(), holidayDow);
    const pay = payForShift(shift, crew.hourlyWage ?? 0);
    return { crew, netMin: shift.netMin, basePay: pay.basePay, nightPay: pay.nightPay, total: pay.total };
  });

  async function handleIssue(crew: UserRow, payroll: ReturnType<typeof computeMonthlyPayroll>, targetMonth: string) {
    setIssuing(crew.id);
    const items = [
      { label: "기본급 (연장 포함)", value: payroll.totals.basePay },
      { label: "야간근로수당 (+50%)", value: payroll.totals.nightPay },
      { label: "주휴수당", value: payroll.weeklyAllowanceTotal },
    ];
    try {
      await fetch("/api/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: crew.id, month: targetMonth, breakdown: items, grandTotal: payroll.grandTotal }),
      });
      setViewing({ crew, items, grandTotal: payroll.grandTotal });
    } finally {
      setIssuing(null);
    }
  }

  const rangeGrandTotal = payrollRows.reduce((s, r) => s + r.payroll.grandTotal, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>급여 관리</h2>
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

      <div className="mb-6">
        {mode === "day" && (
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        )}
        {mode === "month" && (
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        )}
        {mode === "range" && (
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
            <span className="text-sm" style={{ color: "#8A9088" }}>~</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
            <span className="text-xs" style={{ color: "#8A9088" }}>기준일(마지막 날짜)까지 합산해서 보여줘요</span>
          </div>
        )}
      </div>

      {mode === "day" && (
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "560px" }}>
              <thead>
                <tr style={{ background: "#F7F8F5" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>기본급+연장</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>야간</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>합계</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map(({ crew, netMin, basePay, nightPay, total }) => (
                  <tr key={crew.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{crew.name}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{durationLabel(netMin * 60000)}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(basePay).toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(nightPay).toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: "var(--font-mono)", color: "#1B2420" }}>{Math.round(total).toLocaleString()}원</td>
                  </tr>
                ))}
                {dayRows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(mode === "month" || mode === "range") && (
        <>
          {mode === "range" && (
            <div className="rounded-xl border bg-white p-4 mb-4 flex items-center justify-between" style={{ borderColor: "#DDE1D8" }}>
              <span className="text-sm" style={{ color: "#5B6660" }}>{fromDate} ~ {toDate} 합산</span>
              <span className="text-xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{Math.round(rangeGrandTotal).toLocaleString()}원</span>
            </div>
          )}
          <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "720px" }}>
                <thead>
                  <tr style={{ background: "#F7F8F5" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>기본급+연장</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>야간</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>주휴</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>실지급액</th>
                    {mode === "month" && <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>명세서</th>}
                  </tr>
                </thead>
                <tbody>
                  {payrollRows.map(({ crew, payroll }) => (
                    <Fragment key={crew.id}>
                      <tr className="border-t" style={{ borderColor: "#EEF0EA" }}>
                        <td className="px-4 py-3 font-medium">
                          {mode === "range" ? (
                            <button onClick={() => setExpanded(expanded === crew.id ? null : crew.id)} style={{ color: "#1B2420", textDecoration: "underline" }}>
                              {crew.name}
                            </button>
                          ) : (
                            <span style={{ color: "#1B2420" }}>{crew.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{durationLabel(payroll.totals.netMin * 60000)}</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.totals.basePay).toLocaleString()}원</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.totals.nightPay).toLocaleString()}원</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(payroll.weeklyAllowanceTotal).toLocaleString()}원</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: "var(--font-mono)", color: "#1B2420" }}>{payroll.grandTotal.toLocaleString()}원</td>
                        {mode === "month" && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleIssue(crew, payroll, month)}
                              disabled={issuing === crew.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#1B2420", color: "#F7F8F5" }}
                            >
                              {issuing === crew.id ? "발급 중..." : "발급"}
                            </button>
                          </td>
                        )}
                      </tr>
                      {mode === "range" && expanded === crew.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3" style={{ background: "#F7F8F5" }}>
                            <div className="text-xs font-semibold mb-2" style={{ color: "#5B6660" }}>월별 내역</div>
                            <div className="space-y-1">
                              {Object.entries(payroll.byMonth).sort().map(([m, v]) => (
                                <div key={m} className="flex items-center justify-between text-sm">
                                  <span style={{ color: "#3B443E" }}>{m}</span>
                                  <span style={{ fontFamily: "var(--font-mono)", color: "#1B2420" }}>{Math.round(v.grandTotal).toLocaleString()}원</span>
                                </div>
                              ))}
                              {Object.keys(payroll.byMonth).length === 0 && <p className="text-xs" style={{ color: "#8A9088" }}>해당 기간 근무 기록이 없어요.</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {payrollRows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-xs mt-4" style={{ color: "#8A9088" }}>
        연장(1일 8시간 초과 ×1.5) · 야간(22:00~06:00 ×0.5 가산) · 휴일근로(주휴일 근무 ×1.5, 8시간 초과 ×2.0) · 주휴수당(주 15시간↑ 근무 시)을 자동 반영한 추정치예요. 4대보험 공제는 포함되지 않았어요.
      </p>

      {viewing && (
        <PayslipView
          employeeName={viewing.crew.name}
          storeName={storeName}
          month={month}
          items={viewing.items}
          grandTotal={viewing.grandTotal}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
