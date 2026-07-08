"use client";

import { useEffect, useState } from "react";
import ContractPreview from "@/components/contracts/ContractPreview";

type Store = { id: string; name: string };
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
type AttendanceRecord = { id: string; userId: string; storeId: string; date: string; editLog: EditLogEntry[] };
type Contract = {
  id: string;
  employeeId: string;
  employeeRole: string;
  storeId: string | null;
  startDate: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
};

function fmtTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

const TABS = [
  { key: "attendance", label: "근태 수정 이력" },
  { key: "contracts", label: "근로계약서 작성" },
] as const;

export default function AdminEditHistoryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("attendance");
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>수정 이력</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>전 지점에서 발생한 수정/작성 이력을 확인해요.</p>

      <div className="flex gap-1.5 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: tab === t.key ? "#1B2420" : "#EEF0EA", color: tab === t.key ? "#F7F8F5" : "#5B6660" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "attendance" ? <AttendanceEditHistory /> : <ContractCreationHistory />}
    </div>
  );
}

function AttendanceEditHistory() {
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

  return entries.length === 0 ? (
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
  );
}

function ContractCreationHistory() {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [previewing, setPreviewing] = useState<Contract | null>(null);

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((d) => setStores(d.stores ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (storeFilter) params.set("storeId", storeFilter);
    if (roleFilter) params.set("employeeRole", roleFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/contracts?${params.toString()}`).then((r) => r.json()).then((d) => setContracts(d.contracts ?? []));
  }, [storeFilter, roleFilter, from, to]);

  function statusLabel(c: Contract) {
    if (c.status === "signed") return { label: "완료", color: "#3F6B4F" };
    return { label: "서명 대기", color: "#B8863B" };
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
          <option value="">전체 지점</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
          <option value="">전체 직급</option>
          <option value="crew">크루</option>
          <option value="manager">매니저</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        <span className="self-center text-sm" style={{ color: "#8A9088" }}>~</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm" style={{ color: "#8A9088" }}>조건에 맞는 계약서가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => {
            const employee = users.find((u) => u.id === c.employeeId);
            const store = stores.find((s) => s.id === c.storeId);
            const { label, color } = statusLabel(c);
            return (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 flex-wrap gap-2" style={{ borderColor: "#DDE1D8" }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>
                    {employee?.name ?? "알 수 없음"} <span className="text-xs font-normal" style={{ color: "#8A9088" }}>({c.employeeRole === "crew" ? "크루" : "매니저"})</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A9088" }}>
                    {store?.name ?? "지점 미지정"} · 계약 시작 {c.startDate} · 작성일 {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                  <button onClick={() => setPreviewing(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#EEF0EA", color: "#1B2420" }}>보기</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewing && (
        <ContractPreview
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contract={previewing as any}
          employeeName={users.find((u) => u.id === previewing.employeeId)?.name ?? "알 수 없음"}
          storeName={stores.find((s) => s.id === previewing.storeId)?.name}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
