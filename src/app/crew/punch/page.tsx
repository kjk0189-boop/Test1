"use client";

import { useEffect, useState, useCallback } from "react";
import QrScanner from "@/components/QrScanner";

type AttendanceRecord = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
};

type Store = { id: string; name: string; address: string | null; qrToken: string };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
}

function durationLabel(ms: number) {
  if (ms < 0) return "-";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}

export default function CrewPunchPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: string; text: string } | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = useCallback(async () => {
    const [storeRes, attRes] = await Promise.all([
      fetch("/api/my-store").then((r) => r.json()),
      fetch(`/api/attendance?date=${todayStr()}`).then((r) => r.json()),
    ]);
    setStore(storeRes.store);
    setRecord(attRes.attendance?.[0] ?? null);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [load]);

  const status = !record ? "before" : !record.checkOut ? "working" : "done";
  const statusLabel = status === "before" ? "출근 전" : status === "working" ? "근무 중" : "퇴근 완료";

  async function submitPunch(qrToken: string) {
    setScannerOpen(false);
    setLoading(true);
    setFlash(null);
    try {
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash({ type: "error", text: data.error || "오류가 발생했어요." });
        return;
      }
      setFlash({
        type: data.status === "checked-in" ? "in" : "out",
        text: data.status === "checked-in" ? `출근 완료 · ${fmtTime(data.record.checkIn)}` : `퇴근 완료 · ${fmtTime(data.record.checkOut)}`,
      });
      await load();
    } finally {
      setLoading(false);
    }
  }

  const workedMs = record?.checkIn ? new Date(record.checkOut ?? now).getTime() - new Date(record.checkIn).getTime() : null;

  if (!store) return <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>출/퇴근</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>{store.name} 매장 QR을 카메라로 스캔해서 출근·퇴근을 기록하세요.</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="md:col-span-3 rounded-2xl p-7" style={{ background: "#1B2420" }}>
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs uppercase" style={{ color: "#8FA396", letterSpacing: "0.2em" }}>{store.name}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#EEF0EA", color: status === "working" ? "#3F6B4F" : "#1B2420" }}>{statusLabel}</span>
          </div>
          <div className="text-center mb-8">
            <div className="text-5xl font-semibold" style={{ color: "#F7F8F5", fontFamily: "var(--font-mono)" }}>
              {now.toLocaleTimeString("ko-KR", { hour12: false })}
            </div>
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            disabled={loading || status === "done"}
            className="w-full py-4 rounded-xl font-bold text-base disabled:opacity-50"
            style={{ background: status === "before" ? "#B8863B" : status === "working" ? "#A64B3A" : "#3B443E", color: "#1B2420" }}
          >
            {loading ? "처리 중..." : status === "before" ? "카메라로 QR 스캔하고 출근하기" : status === "working" ? "카메라로 QR 스캔하고 퇴근하기" : "오늘 근무 완료"}
          </button>
          {flash && (
            <div className="mt-4 text-sm text-center py-2 rounded-lg font-medium" style={{ background: flash.type === "error" ? "#3A2622" : "#233028", color: flash.type === "error" ? "#E39A87" : "#9FCDAE" }}>
              {flash.text}
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-2xl border bg-white p-6" style={{ borderColor: "#DDE1D8" }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#8A9088" }}>오늘 기록</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#5B6660" }}>출근</span>
              <span className="font-semibold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{fmtTime(record?.checkIn ?? null)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#5B6660" }}>퇴근</span>
              <span className="font-semibold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{fmtTime(record?.checkOut ?? null)}</span>
            </div>
            <div className="h-px" style={{ background: "#EEF0EA" }} />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#5B6660" }}>근무 시간</span>
              <span className="font-semibold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{workedMs != null ? durationLabel(workedMs) : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <QrScanner onClose={() => setScannerOpen(false)} onDecode={(text) => submitPunch(text)} />
      )}
    </div>
  );
}
