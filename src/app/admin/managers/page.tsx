"use client";

import { useEffect, useState, useCallback } from "react";

type Store = { id: string; name: string };
type UserRow = { id: string; name: string; role: string; storeId: string | null; phone: string };

export default function AdminManagersPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [managers, setManagers] = useState<UserRow[]>([]);
  const [formTarget, setFormTarget] = useState<UserRow | {} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const load = useCallback(async () => {
    const [storesRes, usersRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setStores(storesRes.stores ?? []);
    setManagers((usersRes.users ?? []).filter((u: UserRow) => u.role === "manager"));
  }, []);

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
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>매니저 관리</h2>
        <button onClick={() => setFormTarget({})} disabled={stores.length === 0} className="px-3.5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: "#B8863B", color: "#1B2420" }}>신규 등록</button>
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>전 지점 매니저를 한 곳에서 등록하고 관리해요.</p>

      <div className="space-y-2">
        {managers.map((m) => {
          const store = stores.find((s) => s.id === m.storeId);
          return (
            <div key={m.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 gap-2" style={{ borderColor: "#DDE1D8" }}>
              <div className="min-w-0">
                <div className="font-semibold" style={{ color: "#1B2420" }}>{m.name}</div>
                <div className="text-xs truncate" style={{ color: "#8A9088" }}>{store?.name ?? "지점 미지정"} · {m.phone}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setFormTarget(m)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>수정</button>
                <button onClick={() => setResetTarget(m)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>비밀번호 초기화</button>
                <button onClick={() => setDeleteTarget(m)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#F5E7E3", color: "#A64B3A" }}>삭제</button>
              </div>
            </div>
          );
        })}
        {managers.length === 0 && <p className="text-sm" style={{ color: "#8A9088" }}>등록된 매니저가 없어요.</p>}
      </div>

      {formTarget !== null && (
        <ManagerFormModal
          initial={isEdit ? (formTarget as UserRow) : null}
          stores={stores}
          onClose={() => setFormTarget(null)}
          onSaved={async () => { setFormTarget(null); await load(); }}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <h3 className="text-base font-bold mb-2" style={{ color: "#A64B3A" }}>매니저 삭제</h3>
            <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{deleteTarget.name}님을 매니저에서 삭제할까요?</p>
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
            <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{resetTarget.name}님의 비밀번호를 0000으로 초기화할까요? 다음 로그인 시 새 비밀번호로 변경을 요청받아요.</p>
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
            <p className="text-sm mb-4" style={{ color: "#3F6B4F" }}>비밀번호가 0000으로 초기화됐어요. 본인에게 알려주세요.</p>
            <button onClick={() => setResetDone(false)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerFormModal({
  initial, stores, onClose, onSaved,
}: { initial: UserRow | null; stores: Store[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [storeId, setStoreId] = useState(initial?.storeId ?? stores[0]?.id ?? "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErr("");
    if (!name.trim()) { setErr("이름을 입력해주세요."); return; }
    if (!storeId) { setErr("소속 지점을 선택해주세요."); return; }
    setSaving(true);
    try {
      if (initial) {
        const res = await fetch(`/api/users/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, storeId }),
        });
        const data = await res.json();
        if (!res.ok) { setErr(data.error || "저장에 실패했어요."); return; }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "manager", name, phone, storeId }),
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#1B2420" }}>{initial ? "매니저 정보 수정" : "신규 매니저 등록"}</h3>
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
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>소속 지점</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
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
