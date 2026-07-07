"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = { id: string; date: string; checkIn: string | null; checkOut: string | null };

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

function durationLabel(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}

export default function CrewHistoryPage() {
  const [month, setMonth] = useState(todayMonth());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetch(`/api/attendance?month=${month}`)
      .then((r) => r.json())
      .then((d) => setRecords((d.attendance ?? []).sort((a: AttendanceRecord, b: AttendanceRecord) => (a.date < b.date ? 1 : -1))));
  }, [month]);

  const totalMs = records.reduce((sum, r) => (r.checkIn && r.checkOut ? sum + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) : sum), 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>내 근무 기록</h2>
        <input type="month" value={month} max={todayMonth()} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{month} 기록이에요.</p>

      <div className="rounded-xl border bg-white p-5 mb-5 flex items-center justify-between" style={{ borderColor: "#DDE1D8" }}>
        <span className="text-sm" style={{ color: "#5B6660" }}>이번 달 누적 근무 시간</span>
        <span className="text-xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{durationLabel(totalMs)}</span>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm" style={{ color: "#8A9088" }}>해당 월에는 근무 기록이 없어요.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr style={{ background: "#F7F8F5" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>날짜</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>출근</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>퇴근</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{r.date}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{fmtTime(r.checkIn)}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{fmtTime(r.checkOut)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                      {r.checkIn && r.checkOut ? durationLabel(new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) : "근무 중"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
