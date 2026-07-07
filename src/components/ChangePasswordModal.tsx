"use client";

import { useState } from "react";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError(null);
    if (pw1 !== pw2) {
      setError("새 비밀번호가 서로 일치하지 않아요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: pw1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "변경에 실패했어요.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>비밀번호 변경</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>
        {done ? (
          <div>
            <p className="text-sm mb-4" style={{ color: "#3F6B4F" }}>비밀번호가 변경됐어요.</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>닫기</button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>현재 비밀번호</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>새 비밀번호</label>
                <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>새 비밀번호 확인</label>
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
              </div>
              {error && <div className="text-xs" style={{ color: "#A64B3A" }}>{error}</div>}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#1B2420", color: "#F7F8F5" }}>
                {loading ? "처리 중..." : "변경"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
