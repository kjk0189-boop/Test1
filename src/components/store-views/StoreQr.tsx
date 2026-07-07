"use client";

import { useState } from "react";

export default function StoreQr({
  storeName,
  address,
  qrToken,
}: {
  storeName: string;
  address?: string | null;
  qrToken: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(qrToken)}`;

  return (
    <div className="max-w-xl">
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>매장 QR</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>출력해서 카운터에 붙여두면 크루원이 카메라로 스캔해 출퇴근할 수 있어요.</p>

      <div className="rounded-2xl border bg-white p-8 flex flex-col items-center" style={{ borderColor: "#DDE1D8" }}>
        <div className="text-xs uppercase mb-1" style={{ color: "#8A9088", letterSpacing: "0.2em" }}>Punch · 출퇴근 QR</div>
        <div className="text-xl font-bold mb-5" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>{storeName}</div>
        {imgOk ? (
          <img src={qrUrl} alt={`${storeName} 출퇴근 QR`} width={240} height={240} onError={() => setImgOk(false)} className="rounded-lg" />
        ) : (
          <div className="w-60 h-60 rounded-lg flex flex-col items-center justify-center text-center px-4" style={{ background: "#EEF0EA" }}>
            <p className="text-xs" style={{ color: "#5B6660" }}>QR 이미지를 불러오지 못했어요.</p>
            <p className="text-xs mt-2 font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{qrToken}</p>
          </div>
        )}
        <p className="text-xs mt-5" style={{ color: "#8A9088" }}>{address || ""}</p>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold"
        style={{ background: "#B8863B", color: "#1B2420" }}
      >
        인쇄하기
      </button>
    </div>
  );
}
