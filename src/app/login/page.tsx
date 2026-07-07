"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function normalizePhone(v: string) {
  return v.replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인에 실패했어요.");
        return;
      }
      if (data.mustChangePassword) {
        router.push("/first-password");
        return;
      }
      const home = data.role === "crew" ? "/crew/punch" : data.role === "manager" ? "/manager/dashboard" : "/admin/overview";
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
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "#1B2420" }}>
            <span style={{ color: "#B8863B" }}>●</span>
          </div>
          <span className="text-xs font-semibold uppercase mb-1" style={{ color: "#5B6660", letterSpacing: "0.2em" }}>
            Punch
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>
            출퇴근 · 근태 관리
          </h1>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>휴대폰번호 (아이디)</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
              placeholder="01000000000"
              maxLength={11}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="••••"
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
            {loading ? "확인 중..." : "로그인"}
          </button>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: "#8A9088" }}>
          계정은 매니저·관리자가 등록해줘요. 초기 비밀번호는 0000이에요.
        </p>
      </div>
    </div>
  );
}
