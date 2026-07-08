"use client";

import { useEffect, useState, use as usePromise } from "react";
import SignaturePad from "@/components/contracts/SignaturePad";
import { WEEKDAYS } from "@/components/contracts/ContractEditorModal";

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
};

export default function ContractSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params);
  const [data, setData] = useState<{ contract: Contract; employeeName: string; storeName: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/contracts/sign/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  }, [token]);

  async function handleSign(dataUrl: string) {
    const res = await fetch(`/api/contracts/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeSignature: dataUrl }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "서명에 실패했어요.");
      return;
    }
    setDone(true);
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ background: "#EEF0EA" }}>
        <p className="text-sm" style={{ color: "#A64B3A" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#EEF0EA" }}>
        <p className="text-sm" style={{ color: "#8A9088" }}>불러오는 중...</p>
      </div>
    );
  }

  const { contract, employeeName, storeName } = data;

  if (done || contract.status === "signed") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ background: "#EEF0EA" }}>
        <div className="max-w-sm text-center">
          <p className="text-base font-semibold mb-2" style={{ color: "#3F6B4F" }}>서명이 완료됐어요.</p>
          <p className="text-sm" style={{ color: "#5B6660" }}>이 창은 이제 닫으셔도 돼요.</p>
        </div>
      </div>
    );
  }

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
  ];

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-10" style={{ background: "#EEF0EA" }}>
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: "#1B2420" }}>근로계약서 서명</h1>
        <p className="text-sm text-center mb-6" style={{ color: "#5B6660" }}>{employeeName}님, 계약 내용을 확인한 뒤 서명해주세요.</p>

        <div className="rounded-2xl border bg-white p-6 mb-5" style={{ borderColor: "#DDE1D8" }}>
          <p className="text-sm mb-4" style={{ color: "#3B443E" }}>
            {storeName ?? "회사"}(사업주)과(와) {employeeName}(근로자)은 다음과 같이 근로계약을 체결한다.
          </p>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #EEF0EA" }}>
                  <td className="py-2 pr-3 font-semibold align-top w-28" style={{ color: "#5B6660" }}>{label}</td>
                  <td className="py-2" style={{ color: "#1B2420" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-3 rounded-lg font-bold text-sm"
            style={{ background: "#1B2420", color: "#F7F8F5" }}
          >
            내용을 확인했어요, 서명하러 가기
          </button>
        ) : (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#DDE1D8" }}>
            <SignaturePad label="근로자 서명" onDone={handleSign} />
          </div>
        )}
      </div>
    </div>
  );
}
