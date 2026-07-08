"use client";

import { useEffect, useState, useCallback } from "react";
import StoreLocationSettings from "@/components/store-views/StoreLocationSettings";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Store = {
  id: string; name: string; address: string | null; weeklyHolidayDow: number;
  latitude: number | null; longitude: number | null; radiusMeters: number;
};
type UserRow = { id: string; name: string; role: string; storeId: string | null };

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const load = useCallback(async () => {
    const [storesRes, usersRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setStores(storesRes.stores ?? []);
    setUsers(usersRes.users ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    setErr("");
    if (!name.trim()) { setErr("지점명을 입력해주세요."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "추가에 실패했어요."); return; }
      setShowForm(false);
      setName(""); setAddress("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>지점 관리</h2>
        <button onClick={() => setShowForm(true)} className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ background: "#B8863B", color: "#1B2420" }}>신규 지점 추가</button>
      </div>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>등록된 지점 목록이에요. 매니저 등록·수정은 &quot;매니저 관리&quot;에서 해요.</p>

      <div className="space-y-2">
        {stores.map((s) => {
          const crewCount = users.filter((u) => u.role === "crew" && u.storeId === s.id).length;
          const managers = users.filter((u) => u.role === "manager" && u.storeId === s.id);
          return (
            <div key={s.id} className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#DDE1D8" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold" style={{ color: "#1B2420" }}>{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A9088" }}>{s.address || "주소 미등록"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A9088" }}>
                    주휴일 {WEEKDAYS[s.weeklyHolidayDow ?? 0]}요일 · 위치 확인 {s.latitude != null ? `등록됨 (반경 ${s.radiusMeters}m)` : "미등록"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs" style={{ color: "#8A9088" }}>
                    <div>크루원 {crewCount}명</div>
                    <div>매니저 {managers.map((m) => m.name).join(", ") || "미지정"}</div>
                  </div>
                  <button onClick={() => setEditingStore(s)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "#EEF0EA" }}>수정</button>
                </div>
              </div>
            </div>
          );
        })}
        {stores.length === 0 && <p className="text-sm" style={{ color: "#8A9088" }}>등록된 지점이 없어요.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1B2420" }}>신규 지점 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>지점명</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 신촌점" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>주소</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
              </div>
              {err && <p className="text-xs" style={{ color: "#A64B3A" }}>{err}</p>}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#1B2420", color: "#F7F8F5" }}>
                {saving ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStore && (
        <StoreEditModal
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onSaved={async () => { setEditingStore(null); await load(); }}
        />
      )}
    </div>
  );
}

function StoreEditModal({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address ?? "");
  const [weeklyHolidayDow, setWeeklyHolidayDow] = useState(store.weeklyHolidayDow ?? 0);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErr("");
    if (!name.trim()) { setErr("지점명을 입력해주세요."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, weeklyHolidayDow }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "저장에 실패했어요."); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 overflow-y-auto" style={{ border: "1px solid #DDE1D8", maxHeight: "88vh" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>지점 정보 수정</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>지점명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>주소</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>주휴일 요일</label>
            <select value={weeklyHolidayDow} onChange={(e) => setWeeklyHolidayDow(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }}>
              {WEEKDAYS.map((label, i) => <option key={i} value={i}>{label}요일</option>)}
            </select>
          </div>
          {err && <p className="text-xs" style={{ color: "#A64B3A" }}>{err}</p>}
        </div>
        <div className="flex gap-2 mb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#1B2420", color: "#F7F8F5" }}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        <StoreLocationSettings
          storeId={store.id}
          initialLatitude={store.latitude}
          initialLongitude={store.longitude}
          initialRadius={store.radiusMeters}
        />
      </div>
    </div>
  );
}
