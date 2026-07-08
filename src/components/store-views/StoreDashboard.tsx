"use client";

import { useEffect, useState } from "react";

type UserRow = { id: string; name: string; role: string; storeId: string | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null; checkInDistance: number | null; checkOutDistance: number | null };
type StoreInfo = { id: string; radiusMeters: number };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

export default function StoreDashboard({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [radius, setRadius] = useState(100);

  useEffect(() => {
    async function load() {
      const [usersRes, attRes, storesRes] = await Promise.all([
        fetch("/api/users").then((r) => r.json()),
        fetch(`/api/attendance?storeId=${storeId}&date=${todayStr()}`).then((r) => r.json()),
        fetch("/api/stores").then((r) => r.json()),
      ]);
      setCrewList((usersRes.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
      setRecords(attRes.attendance ?? []);
      const storeInfo = (storesRes.stores ?? []).find((s: StoreInfo) => s.id === storeId);
      if (storeInfo) setRadius(storeInfo.radiusMeters);
    }
    load();
  }, [storeId]);

  function locationBadge(rec: AttendanceRecord | undefined) {
    if (!rec) return null;
    const flaggedIn = rec.checkInDistance != null && rec.checkInDistance > radius;
    const flaggedOut = rec.checkOutDistance != null && rec.checkOutDistance > radius;
    if (!flaggedIn && !flaggedOut) return null;
    const dist = flaggedOut ? rec.checkOutDistance : rec.checkInDistance;
    return (
      <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#F5E7E3", color: "#A64B3A" }}>
        ⚠️ 매장에서 {dist}m
      </span>
    );
  }

  const rows = crewList.map((u) => {
    const rec = records.find((r) => r.userId === u.id);
    const status = !rec ? "미출근" : !rec.checkOut ? "근무 중" : "퇴근 완료";
    const color = status === "근무 중" ? "#3F6B4F" : status === "미출근" ? "#8A9088" : "#5B6660";
    const workedMs = rec?.checkIn ? new Date(rec.checkOut ?? Date.now()).getTime() - new Date(rec.checkIn).getTime() : null;
    return { user: u, rec, status, color, workedMs };
  });

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>{storeName} 출근 현황</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>오늘 기준 실시간 현황이에요.</p>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ background: "#F7F8F5" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>상태</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>출근</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>퇴근</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user, rec, status, color, workedMs }) => (
                <tr key={user.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{user.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#EEF0EA", color }}>{status}</span>
                    {locationBadge(rec)}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{fmtTime(rec?.checkIn ?? null)}</td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{fmtTime(rec?.checkOut ?? null)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{workedMs != null ? durationLabel(workedMs) : "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
