"use client";

import { useEffect, useState } from "react";

type Store = { id: string; name: string };
type UserRow = { id: string; role: string; storeId: string | null };
type AttendanceRecord = { id: string; userId: string; date: string; checkIn: string | null; checkOut: string | null };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminOverviewPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [storesRes, usersRes, attRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
        fetch(`/api/attendance?date=${todayStr()}`).then((r) => r.json()),
      ]);
      setStores(storesRes.stores ?? []);
      setUsers(usersRes.users ?? []);
      setAttendance(attRes.attendance ?? []);
    }
    load();
  }, []);

  const rows = stores.map((store) => {
    const crewIds = users.filter((u) => u.role === "crew" && u.storeId === store.id).map((u) => u.id);
    const attended = attendance.filter((r) => crewIds.includes(r.userId));
    const working = attended.filter((r) => r.checkIn && !r.checkOut);
    return { store, crewCount: crewIds.length, attendedCount: attended.length, workingCount: working.length };
  });

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>통합 대시보드</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>오늘 기준 전 지점 현황이에요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#DDE1D8" }}>
          <div className="text-xs mb-1" style={{ color: "#8A9088" }}>전체 지점</div>
          <div className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{stores.length}개</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#DDE1D8" }}>
          <div className="text-xs mb-1" style={{ color: "#8A9088" }}>전체 크루원</div>
          <div className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{users.filter((u) => u.role === "crew").length}명</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#DDE1D8" }}>
          <div className="text-xs mb-1" style={{ color: "#8A9088" }}>오늘 근무중</div>
          <div className="text-2xl font-bold" style={{ color: "#3F6B4F", fontFamily: "var(--font-mono)" }}>{rows.reduce((s, r) => s + r.workingCount, 0)}명</div>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr style={{ background: "#F7F8F5" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>지점</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>출근</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무중</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ store, crewCount, attendedCount, workingCount }) => (
                <tr key={store.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{store.name}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{crewCount}명</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>{attendedCount}명</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: "#3F6B4F", fontFamily: "var(--font-mono)" }}>{workingCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
