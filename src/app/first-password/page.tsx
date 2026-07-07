"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FirstPasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("0000");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (pw1 !== pw2) {
      setError("비밀번호가 서로 일치하지 않아요.");
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
      const meRes = await fetch("/api/me");
      const me = await meRes.json();
      const role = me?.user?.role;
      const home = role === "crew" ? "/crew/punch" : role === "manager" ? "/manager/dashboard" : "/admin/overview";
      router.push(home);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-7" style={{ borderColor: "#DDE1D8" }}>
        <h1 className="text-lg font-bold mb-2" style={{ color: "#1B2420" }}>비밀번호 변경이 필요해요</h1>
        <p className="text-sm mb-6" style={{ color: "#5B6660" }}>
          최초 로그인이라 새 비밀번호로 바꿔야 계속 진행할 수 있어요.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>현재 비밀번호</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>새 비밀번호</label>
            <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>새 비밀번호 확인</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: "#A64B3A" }}>{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm mt-1 disabled:opacity-50"
            style={{ background: "#1B2420", color: "#F7F8F5" }}
          >
            {loading ? "처리 중..." : "비밀번호 변경하고 시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
