"use client";

import { useState } from "react";

export default function StoreLocationSettings({
  storeId,
  initialLatitude,
  initialLongitude,
  initialRadius,
}: {
  storeId: string;
  initialLatitude: number | null;
  initialLongitude: number | null;
  initialRadius: number;
}) {
  const [lat, setLat] = useState<string>(initialLatitude != null ? String(initialLatitude) : "");
  const [lng, setLng] = useState<string>(initialLongitude != null ? String(initialLongitude) : "");
  const [radius, setRadius] = useState(initialRadius);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "저장에 실패했어요." });
        return;
      }
      setMessage({ type: "ok", text: "저장됐어요." });
    } finally {
      setSaving(false);
    }
  }

  function handleCaptureLocation() {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "이 브라우저는 위치 기능을 지원하지 않아요." });
      return;
    }
    setCapturing(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(String(newLat));
        setLng(String(newLng));
        await save({ latitude: newLat, longitude: newLng });
        setCapturing(false);
      },
      () => {
        setMessage({ type: "error", text: "위치를 가져오지 못했어요. 브라우저 위치 권한을 확인해주세요." });
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleManualSave() {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setMessage({ type: "error", text: "위도/경도를 숫자로 입력해주세요." });
      return;
    }
    save({ latitude: latNum, longitude: lngNum, radiusMeters: radius });
  }

  function handleClear() {
    setLat("");
    setLng("");
    save({ latitude: null, longitude: null });
  }

  const hasLocation = initialLatitude != null && initialLongitude != null;

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#DDE1D8" }}>
      <div className="text-sm font-semibold mb-1" style={{ color: "#1B2420" }}>매장 위치 (대리 출퇴근 방지)</div>
      <p className="text-xs mb-4" style={{ color: "#8A9088" }}>
        {hasLocation
          ? "등록됨 · 크루가 출퇴근할 때 이 위치 기준으로 거리를 확인해요."
          : "아직 등록 안 됨 · 등록하지 않으면 위치 확인 없이 QR만으로 출퇴근돼요."}
      </p>

      <button
        onClick={handleCaptureLocation}
        disabled={capturing || saving}
        className="w-full py-2.5 rounded-lg text-sm font-semibold mb-3 disabled:opacity-50"
        style={{ background: "#1B2420", color: "#F7F8F5" }}
      >
        {capturing ? "위치 확인 중..." : "지금 여기(매장)를 위치로 저장"}
      </button>
      <p className="text-xs mb-4" style={{ color: "#8A9088" }}>매장 안에서 이 버튼을 누르면, 지금 서 있는 위치가 매장 기준 좌표로 저장돼요.</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>위도</label>
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="예: 37.4979" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>경도</label>
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="예: 127.0276" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>허용 반경(m)</label>
        <input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8", fontFamily: "var(--font-mono)" }} />
      </div>

      {message && (
        <p className="text-xs mb-3" style={{ color: message.type === "ok" ? "#3F6B4F" : "#A64B3A" }}>{message.text}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleManualSave} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "#EEF0EA", color: "#1B2420" }}>
          수동 좌표로 저장
        </button>
        {hasLocation && (
          <button onClick={handleClear} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "#F5E7E3", color: "#A64B3A" }}>
            위치 확인 끄기
          </button>
        )}
      </div>
    </div>
  );
}
