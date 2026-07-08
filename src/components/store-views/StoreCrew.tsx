"use client";

import { useEffect, useState, useCallback } from "react";

type UserRow = {
  id: string; name: string; role: string; storeId: string | null;
  phone: string; hourlyWage: number | null; hireDate: string | null; active: boolean;
  position: string | null;
};

const POSITION_COLOR: Record<string, string> = {
  "신입": "#B8863B",
  "일반": "#5B6660",
  "선임": "#3F6B4F",
};

export default function StoreCrew({ storeId }: { storeId: string }) {
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [formTarget, setFormTarget] = useState<UserRow | {} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const load = useCallback(async () => {
    const usersRes = await fetch("/api/users").then((r) => r.json());
    setCrewList((usersRes.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await load();
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    await fetch(`/api/users/${resetTarget.id}/reset-password`, { method: "POST" });
    setResetTarget(null);
    setResetDone(true);
  }

  const isEdit = formTarget && "id" in formTarget;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>크루원 관리</h2>
        <button onClick={() => setFormTarget({})} className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ background: "#B8863B", color: "#1B2420" }}>신규 등록</button>
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>등록된 크루원의 인적사항과 시급을 관리해요.</p>

      <div className="space-y-2">
        {crewList.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 gap-2" style={{ borderColor: "#DDE1D8" }}>
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-2" style={{ color: "#1B2420" }}>
                {u.name}
                {u.position && (
                  <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#EEF0EA", color: POSITION_COLOR[u.position] ?? "#5B6660", fontSize: "10px" }}>{u.position}</span>
                )}
                {!u.active && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#F5E7E3", color: "#A64B3A", fontSize: "10px" }}>퇴사</span>}
              </div>
              <div className="text-xs truncate" style={{ color: "#8A9088" }}>{u.phone} · 시급 {u.hourlyWage?.toLocaleString()}원 · 입사 {u.hireDate}</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setFormTarget(u)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>수정</button>
              <button onClick={() => setResetTarget(u)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>비밀번호 초기화</button>
              <button onClick={() => setDeleteTarget(u)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#F5E7E3", color: "#A64B3A" }}>삭제</button>
            </div>
          </div>
        ))}
        {crewList.length === 0 && <p className="text-sm" style={{ color: "#8A9088" }}>등록된 크루원이 없어요.</p>}
      </div>

      {formTarget !== null && (
        <CrewFormModal
          initial={isEdit ? (formTarget as UserRow) : null}
          storeId={storeId}
          onClose={() => setFormTarget(null)}
          onSaved={async () => { setFormTarget(null); await load(); }}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <h3 className="text-base font-bold mb-2" style={{ color: "#A64B3A" }}>크루원 삭제</h3>
            <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{deleteTarget.name}님을 삭제할까요?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#A64B3A", color: "#FDF3F0" }}>삭제</button>
            </div>
          </div>
        </div>
      )}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <h3 className="text-base font-bold mb-2" style={{ color: "#1B2420" }}>비밀번호 초기화</h3>
            <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{resetTarget.name}님의 비밀번호를 0000으로 초기화할까요?</p>
            <div className="flex gap-2">
              <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
              <button onClick={handleResetPassword} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>초기화</button>
            </div>
          </div>
        </div>
      )}
      {resetDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <p className="text-sm mb-4" style={{ color: "#3F6B4F" }}>비밀번호가 0000으로 초기화됐어요.</p>
            <button onClick={() => setResetDone(false)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CrewFormModal({
  initial, storeId, onClose, onSaved,
}: { initial: UserRow | null; storeId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [hourlyWage, setHourlyWage] = useState(initial?.hourlyWage ?? 10030);
  const [hireDate, setHireDate] = useState(initial?.hireDate ?? "");
  const [position, setPosition] = useState(initial?.position ?? "신입");
  const [active, setActive] = useState(initial?.active ?? true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErr("");
    if (!name.trim()) { setErr("이름을 입력해주세요."); return; }
    setSaving(true);
    try {
      if (initial) {
        const res = await fetch(`/api/users/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, hourlyWage: Number(hourlyWage), hireDate, position, active }),
        });
        const data = await res.json();
        if (!res.ok) { setErr(data.error || "저장에 실패했어요."); return; }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "crew", name, phone, storeId, hourlyWage: Number(hourlyWage), hireDate }),
        });
        const data = await res.json();
        if (!res.ok) { setErr(data.error || "등록에 실패했어요."); return; }
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
        <h3 className="text-lg font-bold mb-5" style={{ color: "#1B2420" }}>{initial ? "크루원 정보 수정" : "신규 크루원 등록"}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>연락처 (로그인 아이디)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="01000000000"
              maxLength={11}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }}
            />
            {!initial && <p className="text-xs mt-1" style={{ color: "#8A9088" }}>초기 비밀번호는 0000, 최초 로그인 시 변경이 필요해요.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>시급(원)</label>
              <input type="number" value={hourlyWage} onChange={(e) => setHourlyWage(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>입사일</label>
              <input type="date" value={hireDate ?? ""} onChange={(e) => setHireDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
            </div>
          </div>
          {initial && (
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>직책</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
                <option value="신입">신입 크루</option>
                <option value="일반">일반 크루</option>
                <option value="선임">선임 크루</option>
              </select>
              <p className="text-xs mt-1" style={{ color: "#8A9088" }}>신입 크루는 입사 후 90일이 지나면 자동으로 일반 크루로 바뀌어요.</p>
            </div>
          )}
          {initial && (
            <label className="flex items-center gap-2 text-sm" style={{ color: "#3B443E" }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> 재직 중
            </label>
          )}
          {err && <p className="text-xs" style={{ color: "#A64B3A" }}>{err}</p>}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#1B2420", color: "#F7F8F5" }}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
