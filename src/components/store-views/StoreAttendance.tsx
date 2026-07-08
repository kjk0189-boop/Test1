"use client";

import { useEffect, useState, useCallback } from "react";

type UserRow = { id: string; name: string; role: string; storeId: string | null };
type EditLogEntry = {
  editedBy: string;
  editedAt: number;
  oldCheckIn: string | null;
  newCheckIn: string | null;
  oldCheckOut: string | null;
  newCheckOut: string | null;
  reason: string;
};
type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInDistance: number | null;
  checkOutDistance: number | null;
  editLog: EditLogEntry[];
};
type StoreInfo = { id: string; radiusMeters: number };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(iso: string | null) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}
function timeInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function composeIso(dateStr: string, timeStr: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function durationLabel(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}

export default function StoreAttendance({ storeId }: { storeId: string }) {
  const [date, setDate] = useState(todayStr());
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [radius, setRadius] = useState(100);
  const [editing, setEditing] = useState<{ user: UserRow; rec: AttendanceRecord | null } | null>(null);
  const [viewingLog, setViewingLog] = useState<{ user: UserRow; rec: AttendanceRecord } | null>(null);

  const load = useCallback(async () => {
    const [usersRes, attRes, storesRes] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch(`/api/attendance?storeId=${storeId}&date=${date}`).then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]);
    setCrewList((usersRes.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
    setRecords(attRes.attendance ?? []);
    const storeInfo = (storesRes.stores ?? []).find((s: StoreInfo) => s.id === storeId);
    if (storeInfo) setRadius(storeInfo.radiusMeters);
  }, [storeId, date]);

  useEffect(() => { load(); }, [load]);

  function locationBadge(rec: AttendanceRecord | null) {
    if (!rec) return null;
    const flaggedIn = rec.checkInDistance != null && rec.checkInDistance > radius;
    const flaggedOut = rec.checkOutDistance != null && rec.checkOutDistance > radius;
    if (!flaggedIn && !flaggedOut) return null;
    const dist = flaggedOut ? rec.checkOutDistance : rec.checkInDistance;
    return (
      <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#F5E7E3", color: "#A64B3A" }}>
        ⚠️ {dist}m
      </span>
    );
  }

  async function handleSaveEdit(checkIn: string | null, checkOut: string | null, reason: string) {
    if (!editing) return;
    if (editing.rec) {
      await fetch(`/api/attendance/${editing.rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, reason }),
      });
    } else {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.user.id, date, checkIn, checkOut, reason }),
      });
    }
    setEditing(null);
    await load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>근태 관리</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>출퇴근 기록을 직접 수정할 수 있어요. 모든 수정은 사유와 함께 로그에 남아요.</p>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#DDE1D8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ background: "#F7F8F5" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>크루원</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>출근</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>퇴근</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>근무시간</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#5B6660" }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {crewList.map((u) => {
                const rec = records.find((r) => r.userId === u.id) ?? null;
                return (
                  <tr key={u.id} className="border-t" style={{ borderColor: "#EEF0EA" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1B2420" }}>{u.name}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>
                      {fmtTime(rec?.checkIn ?? null)}
                      {locationBadge(rec)}
                    </td>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>{fmtTime(rec?.checkOut ?? null)}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>
                      {rec?.checkIn && rec?.checkOut ? durationLabel(new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime()) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {rec && rec.editLog?.length > 0 && (
                          <button onClick={() => setViewingLog({ user: u, rec })} className="px-2 py-1.5 rounded-md text-xs" style={{ background: "#F7F8F5" }}>이력</button>
                        )}
                        <button onClick={() => setEditing({ user: u, rec })} className="px-2 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>수정</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {crewList.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal
          date={date}
          crewName={editing.user.name}
          initialCheckIn={timeInputValue(editing.rec?.checkIn ?? null)}
          initialCheckOut={timeInputValue(editing.rec?.checkOut ?? null)}
          onClose={() => setEditing(null)}
          onSave={(ci, co, reason) => handleSaveEdit(composeIso(date, ci), composeIso(date, co), reason)}
        />
      )}
      {viewingLog && <LogModal userName={viewingLog.user.name} logs={viewingLog.rec.editLog} onClose={() => setViewingLog(null)} />}
    </div>
  );
}

function EditModal({
  date, crewName, initialCheckIn, initialCheckOut, onClose, onSave,
}: {
  date: string; crewName: string; initialCheckIn: string; initialCheckOut: string;
  onClose: () => void; onSave: (checkIn: string, checkOut: string, reason: string) => void;
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  function handleSave() {
    if (!checkIn && !checkOut) { setErr("출근 또는 퇴근 시간 중 하나는 입력해주세요."); return; }
    if (!reason.trim()) { setErr("수정 사유를 입력해주세요."); return; }
    onSave(checkIn, checkOut, reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
        <h3 className="text-lg font-bold mb-1" style={{ color: "#1B2420" }}>근태 수정</h3>
        <p className="text-sm mb-5" style={{ color: "#5B6660" }}>{crewName} · {date}</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>출근 시간</label>
            <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>퇴근 시간</label>
            <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>수정 사유 (필수)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          {err && <p className="text-xs" style={{ color: "#A64B3A" }}>{err}</p>}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>저장</button>
        </div>
      </div>
    </div>
  );
}

function LogModal({ userName, logs, onClose }: { userName: string; logs: EditLogEntry[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[80vh] overflow-y-auto" style={{ border: "1px solid #DDE1D8" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>수정 이력 · {userName}</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>
        <div className="space-y-3">
          {logs.slice().reverse().map((l, i) => (
            <div key={i} className="rounded-lg p-3 text-sm" style={{ background: "#F7F8F5" }}>
              <div className="text-xs font-mono mb-1" style={{ color: "#8A9088" }}>{new Date(l.editedAt).toLocaleString("ko-KR")}</div>
              <div className="text-xs" style={{ color: "#5B6660" }}>
                출근 {l.oldCheckIn ? fmtTime(l.oldCheckIn) : "-"} → {l.newCheckIn ? fmtTime(l.newCheckIn) : "-"}
                {"  ·  "}퇴근 {l.oldCheckOut ? fmtTime(l.oldCheckOut) : "-"} → {l.newCheckOut ? fmtTime(l.newCheckOut) : "-"}
              </div>
              <div className="text-xs mt-1 italic" style={{ color: "#8A9088" }}>사유: {l.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
