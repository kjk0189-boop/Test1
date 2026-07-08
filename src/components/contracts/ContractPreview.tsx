"use client";

import { WEEKDAYS } from "./ContractEditorModal";

type Contract = {
  id: string;
  startDate: string;
  noEndDate: boolean;
  endDate: string | null;
  workplace: string | null;
  jobDescription: string | null;
  workDays: number[];
  workStart: string | null;
  workEnd: string | null;
  breakMinutes: number | null;
  hourlyWage: number | null;
  baseSalary: number | null;
  overtimeRate: number | null;
  payDate: string | null;
  insurance: { ei: boolean; ni: boolean; health: boolean; comp: boolean };
  status: string;
  employerSignature: string | null;
  employeeSignature: string | null;
};

export default function ContractPreview({
  contract,
  employeeName,
  storeName,
  onClose,
}: {
  contract: Contract;
  employeeName: string;
  storeName?: string | null;
  onClose: () => void;
}) {
  const rows: [string, string][] = [
    ["계약기간", contract.noEndDate ? `${contract.startDate} ~ 기간의 정함 없음` : `${contract.startDate} ~ ${contract.endDate}`],
    ["근무 장소", contract.workplace || "-"],
    ["업무 내용", contract.jobDescription || "-"],
    ["근무 요일", (contract.workDays ?? []).map((d) => WEEKDAYS[d]).join(", ") + "요일"],
    ["근무 시간", `${contract.workStart ?? "-"} ~ ${contract.workEnd ?? "-"} (휴게 ${contract.breakMinutes ?? 0}분)`],
    contract.hourlyWage != null
      ? ["시급", `${contract.hourlyWage.toLocaleString()}원`]
      : ["급여", `고정 월급 ${contract.baseSalary?.toLocaleString() ?? "-"}원 + 추가근무 시급 ${contract.overtimeRate?.toLocaleString() ?? "-"}원`],
    ["임금 지급일", contract.payDate || "-"],
    [
      "사회보험",
      Object.entries({ ei: "고용보험", ni: "국민연금", health: "건강보험", comp: "산재보험" })
        .filter(([k]) => contract.insurance?.[k as keyof typeof contract.insurance])
        .map(([, v]) => v)
        .join(", ") || "해당 없음",
    ],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 no-print-bg" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 overflow-y-auto" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between mb-6 no-print">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>근로계약서</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>

        {/* 인쇄/PDF 저장 시 이 영역만 출력돼요 */}
        <div className="print-area">
          <h1 className="text-xl font-bold text-center mb-6" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>근 로 계 약 서</h1>
          <p className="text-sm mb-4" style={{ color: "#3B443E" }}>
            {storeName ?? "회사"} (이하 &quot;사업주&quot;라 함)과(와) {employeeName} (이하 &quot;근로자&quot;라 함)은 다음과 같이 근로계약을 체결한다.
          </p>

          <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #EEF0EA" }}>
                  <td className="py-2.5 pr-4 font-semibold align-top w-32" style={{ color: "#5B6660" }}>{label}</td>
                  <td className="py-2.5" style={{ color: "#1B2420" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs mb-6" style={{ color: "#8A9088" }}>위 조건으로 근로계약을 체결하고 이를 성실히 이행할 것을 확인한다.</p>

          {contract.status === "signed" ? (
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="text-center">
                <div className="text-xs mb-2" style={{ color: "#8A9088" }}>사업주 서명</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contract.employerSignature ?? ""} alt="사업주 서명" className="mx-auto h-16 object-contain" />
              </div>
              <div className="text-center">
                <div className="text-xs mb-2" style={{ color: "#8A9088" }}>근로자 서명</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contract.employeeSignature ?? ""} alt="근로자 서명" className="mx-auto h-16 object-contain" />
                <div className="text-xs mt-2 font-semibold" style={{ color: "#1B2420" }}>{employeeName}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm px-4 py-3 rounded-lg no-print" style={{ background: "#F5EEE0", color: "#8A6A2E" }}>
              근로자 서명 대기 중이에요. 링크를 보내서 서명을 받아주세요.
            </div>
          )}
        </div>

        <button onClick={() => window.print()} className="no-print mt-8 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#B8863B", color: "#1B2420" }}>
          PDF로 저장
        </button>
      </div>
    </div>
  );
}
