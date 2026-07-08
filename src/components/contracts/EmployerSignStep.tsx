"use client";

import { useState } from "react";
import SignaturePad from "./SignaturePad";

export default function EmployerSignStep({
  sealImage,
  onDone,
}: {
  sealImage?: string | null;
  onDone: (dataUrl: string) => void;
}) {
  const [mode, setMode] = useState<"seal" | "draw">(sealImage ? "seal" : "draw");

  return (
    <div>
      {sealImage && (
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode("seal")}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ background: mode === "seal" ? "#1B2420" : "#EEF0EA", color: mode === "seal" ? "#F7F8F5" : "#5B6660" }}
          >
            등록된 인감 사용
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ background: mode === "draw" ? "#1B2420" : "#EEF0EA", color: mode === "draw" ? "#F7F8F5" : "#5B6660" }}
          >
            직접 서명
          </button>
        </div>
      )}

      {mode === "seal" && sealImage ? (
        <div className="rounded-lg border p-5 flex flex-col items-center" style={{ borderColor: "#DDE1D8", background: "#FAFBF9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sealImage} alt="사업주 인감" className="h-20 object-contain mb-4" />
          <button type="button" onClick={() => onDone(sealImage)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>
            이 인감으로 서명 확정
          </button>
        </div>
      ) : (
        <SignaturePad label="사업주 서명" onDone={onDone} />
      )}
    </div>
  );
}
