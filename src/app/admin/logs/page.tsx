"use client";

import { useEffect, useState } from "react";

type Store = { id: string; name: string };
type UserRow = { id: string; name: string };
type EditLogEntry = {
  editedBy: string;
  editedAt: number;
  oldCheckIn: string | null;
  newCheckIn: string | null;
  oldCheckOut: string | null;
  newCheckOut: string | null;
  reason: string;
};
type AttendanceRecord = { id: string; userId: string; storeId: string; date: string; editLog: EditLogEntry[] };

function fmtTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

export default function AdminLogsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [storesRes, usersRes, attRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
        fetch("/api/attendance").then((r) => r.json()),
      ]);
      setStores(storesRes.stores ?? []);
      setUsers(usersRes.users ?? []);
      setAttendance(attRes.attendance ?? []);
    }
    load();
  }, []);

  const entries: (EditLogEntry & { date: string; crewName: string; storeName: string; editorName: string })[] = [];
  attendance.forEach((rec) => {
    (rec.editLog ?? []).forEach((log) => {
      const crew = users.find((u) => u.id === rec.userId);
      const store = stores.find((s) => s.id === rec.storeId);
      const editor = users.find((u) => u.id === log.editedBy);
      entries.push({
        ...log,
        date: rec.date,
        crewName: crew?.name ?? "알 수 없음",
        storeName: store?.name ?? "알 수 없음",
        editorName: editor?.name ?? log.editedBy,
      });
    });
  });
  entries.sort((a, b) => b.editedAt - a.editedAt);

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>근태 수정 이력</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>전 지점에서 발생한 출퇴근 기록 수정 내역이에요.</p>

      {entries.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm" style={{ color: "#8A9088" }}>아직 수정 이력이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((l, i) => (
            <div key={i} className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#DDE1D8" }}>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>{l.storeName} · {l.crewName} · {l.date}</div>
                <div className="text-xs font-mono" style={{ color: "#8A9088" }}>{new Date(l.editedAt).toLocaleString("ko-KR")}</div>
              </div>
              <div className="text-xs" style={{ color: "#5B6660" }}>
                출근 {fmtTime(l.oldCheckIn)} → {fmtTime(l.newCheckIn)}
                {"  ·  "}퇴근 {fmtTime(l.oldCheckOut)} → {fmtTime(l.newCheckOut)}
                {"  ·  "}수정자: {l.editorName}
              </div>
              <div className="text-xs mt-1 italic" style={{ color: "#8A9088" }}>사유: {l.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
