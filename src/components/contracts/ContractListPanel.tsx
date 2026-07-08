"use client";

import { useEffect, useState } from "react";
import ContractEditorModal, { ContractFormValues } from "./ContractEditorModal";
import EmployerSignStep from "./EmployerSignStep";
import ContractPreview from "./ContractPreview";

type Employee = { id: string; name: string; hourlyWage?: number | null };
type Contract = {
  id: string;
  employeeId: string;
  status: string;
  signToken: string | null;
  [key: string]: unknown;
};

export default function ContractListPanel({
  employees,
  payMode,
  sealImage,
  defaultWorkplace,
  storeName,
}: {
  employees: Employee[];
  payMode: "hourly" | "salary";
  sealImage?: string | null;
  defaultWorkplace?: string;
  storeName?: string | null;
}) {
  const [contractsMap, setContractsMap] = useState<Record<string, Contract | null>>({});
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [pendingForm, setPendingForm] = useState<ContractFormValues | null>(null);
  const [signingEmployee, setSigningEmployee] = useState<Employee | null>(null);
  const [linkResult, setLinkResult] = useState<{ employee: Employee; link: string } | null>(null);
  const [previewing, setPreviewing] = useState<{ employee: Employee; contract: Contract } | null>(null);

  async function loadAll() {
    const entries = await Promise.all(
      employees.map(async (e) => {
        const res = await fetch(`/api/contracts?employeeId=${e.id}`).then((r) => r.json());
        return [e.id, res.contracts?.[0] ?? null] as const;
      })
    );
    setContractsMap(Object.fromEntries(entries));
  }

  useEffect(() => {
    if (employees.length > 0) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.map((e) => e.id).join(",")]);

  function handleFormSave(values: ContractFormValues) {
    setPendingForm(values);
    setSigningEmployee(editingEmployee);
    setEditingEmployee(null);
  }

  async function handleEmployerSign(employerSignature: string) {
    if (!signingEmployee || !pendingForm) return;
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: signingEmployee.id,
        ...pendingForm,
        employerSignature,
      }),
    });
    const data = await res.json();
    setSigningEmployee(null);
    setPendingForm(null);
    if (res.ok && data.contract?.signToken) {
      const link = `${window.location.origin}/contract-sign/${data.contract.signToken}`;
      setLinkResult({ employee: signingEmployee, link });
    }
    await loadAll();
  }

  function statusLabel(contract: Contract | null) {
    if (!contract) return { label: "미작성", color: "#8A9088" };
    if (contract.status === "signed") return { label: "완료", color: "#3F6B4F" };
    return { label: "서명 대기", color: "#B8863B" };
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>근로계약서</h2>
      <p className="text-sm mb-6" style={{ color: "#5B6660" }}>계약서를 작성하고 서명 링크를 보내서 서명을 받아요.</p>

      <div className="space-y-2">
        {employees.map((emp) => {
          const contract = contractsMap[emp.id] ?? null;
          const { label, color } = statusLabel(contract);
          return (
            <div key={emp.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 gap-2 flex-wrap" style={{ borderColor: "#DDE1D8" }}>
              <div>
                <div className="font-semibold" style={{ color: "#1B2420" }}>{emp.name}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {label}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {contract && (
                  <button onClick={() => setPreviewing({ employee: emp, contract })} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#EEF0EA", color: "#1B2420" }}>보기</button>
                )}
                {contract?.status === "awaiting_signature" && contract.signToken && (
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/contract-sign/${contract.signToken}`;
                      navigator.clipboard?.writeText(link);
                      setLinkResult({ employee: emp, link });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "#EEF0EA", color: "#1B2420" }}
                  >
                    링크 복사
                  </button>
                )}
                <button onClick={() => setEditingEmployee(emp)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>
                  {contract ? "새로 작성" : "작성하기"}
                </button>
              </div>
            </div>
          );
        })}
        {employees.length === 0 && <p className="text-sm" style={{ color: "#8A9088" }}>대상이 없어요.</p>}
      </div>

      {editingEmployee && (
        <ContractEditorModal
          employeeName={editingEmployee.name}
          payMode={payMode}
          defaultWorkplace={defaultWorkplace}
          defaultHourlyWage={editingEmployee.hourlyWage}
          onClose={() => setEditingEmployee(null)}
          onSave={handleFormSave}
        />
      )}

      {signingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>사업주(고용주) 서명</h3>
              <button onClick={() => { setSigningEmployee(null); setPendingForm(null); }} style={{ color: "#8A9088" }}>✕</button>
            </div>
            <p className="text-sm mb-5" style={{ color: "#5B6660" }}>서명을 완료하면 근로자에게 보낼 서명 링크가 생성돼요.</p>
            <EmployerSignStep sealImage={sealImage} onDone={handleEmployerSign} />
          </div>
        </div>
      )}

      {linkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.45)" }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" style={{ border: "1px solid #DDE1D8" }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#1B2420" }}>서명 링크가 생성됐어요</h3>
            <p className="text-sm mb-4" style={{ color: "#5B6660" }}>
              {linkResult.employee.name}님에게 이 링크를 카카오톡/문자로 보내주세요. 링크를 열면 계약 내용을 먼저 확인하고 서명할 수 있어요.
            </p>
            <div className="rounded-lg border px-3 py-2.5 text-xs break-all mb-4" style={{ borderColor: "#DDE1D8", background: "#F7F8F5", fontFamily: "var(--font-mono)" }}>
              {linkResult.link}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(linkResult.link)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#EEF0EA", color: "#5B6660" }}
              >
                링크 복사
              </button>
              <button onClick={() => setLinkResult(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {previewing && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <ContractPreview contract={previewing.contract as any} employeeName={previewing.employee.name} storeName={storeName} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
