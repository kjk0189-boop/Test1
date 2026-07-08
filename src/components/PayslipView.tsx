"use client";

export default function PayslipView({
  employeeName,
  storeName,
  month,
  items,
  grandTotal,
  note,
  onClose,
}: {
  employeeName: string;
  storeName?: string | null;
  month: string;
  items: { label: string; value: number }[];
  grandTotal: number;
  note?: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 overflow-y-auto" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between mb-6 no-print">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>급여명세서</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>

        {/* 인쇄/PDF 저장 시 이 영역만 출력돼요 */}
        <div className="print-area">
          <h1 className="text-xl font-bold text-center mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>급 여 명 세 서</h1>
          <p className="text-center text-sm mb-6" style={{ color: "#8A9088" }}>{storeName ?? ""} · {month}</p>

          <div className="grid grid-cols-2 text-sm mb-6 gap-y-1.5">
            <div style={{ color: "#5B6660" }}>성명</div>
            <div className="text-right font-semibold" style={{ color: "#1B2420" }}>{employeeName}</div>
          </div>

          <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {items.map((it) => (
                <tr key={it.label} style={{ borderBottom: "1px solid #EEF0EA" }}>
                  <td className="py-2.5" style={{ color: "#5B6660" }}>{it.label}</td>
                  <td className="py-2.5 text-right font-semibold" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{Math.round(it.value).toLocaleString()}원</td>
                </tr>
              ))}
              <tr>
                <td className="py-3 font-bold" style={{ color: "#1B2420" }}>실지급액</td>
                <td className="py-3 text-right font-bold text-lg" style={{ color: "#1B2420", fontFamily: "var(--font-mono)" }}>{Math.round(grandTotal).toLocaleString()}원</td>
              </tr>
            </tbody>
          </table>

          {note && <p className="text-xs mb-4" style={{ color: "#8A9088" }}>비고: {note}</p>}
          <p className="text-xs mb-6" style={{ color: "#8A9088" }}>* 4대보험 공제는 포함되지 않은 금액이에요.</p>
        </div>

        <button onClick={() => window.print()} className="no-print px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#B8863B", color: "#1B2420" }}>
          PDF로 저장
        </button>
      </div>
    </div>
  );
}
