"use client";

import { useRef, useState } from "react";

export default function SealManager({
  storeId,
  sealImage,
  onUpdated,
}: {
  storeId: string;
  sealImage: string | null;
  onUpdated: (sealImage: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(newSeal: string | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sealImage: newSeal }),
      });
      if (res.ok) onUpdated(newSeal);
    } finally {
      setSaving(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("이미지 파일만 업로드할 수 있어요."); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("2MB 이하 이미지로 업로드해주세요."); return; }
    setErr("");
    const reader = new FileReader();
    reader.onload = () => save(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-xl border bg-white p-4 mb-6 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "#DDE1D8" }}>
      <div className="flex items-center gap-3">
        {sealImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sealImage} alt="사업주 인감" className="w-14 h-14 object-contain rounded-lg border p-1" style={{ borderColor: "#DDE1D8" }} />
        ) : (
          <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: "#EEF0EA" }}>
            <span style={{ color: "#8A9088" }}>+</span>
          </div>
        )}
        <div>
          <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>사업주 인감</div>
          <div className="text-xs" style={{ color: "#8A9088" }}>
            {sealImage ? "등록됨 · 계약서 서명 시 바로 사용돼요" : "등록하면 계약서마다 직접 그리지 않고 인감을 사용할 수 있어요"}
          </div>
          {err && <div className="text-xs mt-1" style={{ color: "#A64B3A" }}>{err}</div>}
        </div>
      </div>
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button type="button" disabled={saving} onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "#1B2420", color: "#F7F8F5" }}>
          {sealImage ? "다시 업로드" : "업로드"}
        </button>
        {sealImage && (
          <button type="button" disabled={saving} onClick={() => save(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "#EEF0EA", color: "#A64B3A" }}>
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
