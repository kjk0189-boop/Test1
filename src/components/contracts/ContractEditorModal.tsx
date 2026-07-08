"use client";

import { useState } from "react";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type ContractFormValues = {
  startDate: string;
  noEndDate: boolean;
  endDate: string;
  workplace: string;
  jobDescription: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  breakMinutes: number;
  hourlyWage?: number;
  baseSalary?: number;
  overtimeRate?: number;
  payDate: string;
  insurance: { ei: boolean; ni: boolean; health: boolean; comp: boolean };
};

export default function ContractEditorModal({
  employeeName,
  payMode,
  defaultWorkplace,
  defaultHourlyWage,
  onClose,
  onSave,
}: {
  employeeName: string;
  payMode: "hourly" | "salary";
  defaultWorkplace?: string;
  defaultHourlyWage?: number | null;
  onClose: () => void;
  onSave: (values: ContractFormValues) => void;
}) {
  const [form, setForm] = useState<ContractFormValues>({
    startDate: new Date().toISOString().slice(0, 10),
    noEndDate: true,
    endDate: "",
    workplace: defaultWorkplace ?? "",
    jobDescription: "",
    workDays: [1, 2, 3, 4, 5],
    workStart: "09:00",
    workEnd: "18:00",
    breakMinutes: 60,
    hourlyWage: defaultHourlyWage ?? 10030,
    baseSalary: 2800000,
    overtimeRate: 15000,
    payDate: "매월 10일",
    insurance: { ei: true, ni: true, health: true, comp: true },
  });

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      workDays: f.workDays.includes(d) ? f.workDays.filter((x) => x !== d) : [...f.workDays, d].sort(),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(27,36,32,0.45)" }}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 overflow-y-auto" style={{ border: "1px solid #DDE1D8", maxHeight: "88vh" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "#1B2420" }}>근로계약서 작성 · {employeeName}</h3>
          <button onClick={onClose} style={{ color: "#8A9088" }}>✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>계약 시작일</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold flex items-center justify-between" style={{ color: "#5B6660" }}>
              계약 종료일
              <span className="flex items-center gap-1" style={{ fontSize: "11px" }}>
                <input type="checkbox" checked={form.noEndDate} onChange={(e) => setForm({ ...form, noEndDate: e.target.checked })} />
                기간의 정함 없음
              </span>
            </label>
            <input
              type="date"
              value={form.endDate}
              disabled={form.noEndDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm disabled:opacity-40"
              style={{ borderColor: "#DDE1D8" }}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>근무 장소</label>
          <input value={form.workplace} onChange={(e) => setForm({ ...form, workplace: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>업무 내용</label>
          <input value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })} placeholder="예: 매장 홀 서빙 및 카운터 응대" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>근무 요일</label>
          <div className="flex gap-1.5 mt-1.5">
            {WEEKDAYS.map((label, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className="w-9 h-9 rounded-lg text-xs font-bold"
                style={{ background: form.workDays.includes(d) ? "#1B2420" : "#EEF0EA", color: form.workDays.includes(d) ? "#F7F8F5" : "#8A9088" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>출근 시각</label>
            <input type="time" value={form.workStart} onChange={(e) => setForm({ ...form, workStart: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>퇴근 시각</label>
            <input type="time" value={form.workEnd} onChange={(e) => setForm({ ...form, workEnd: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>휴게시간(분)</label>
            <input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
          </div>
        </div>

        {payMode === "hourly" ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>시급(원)</label>
              <input type="number" value={form.hourlyWage} onChange={(e) => setForm({ ...form, hourlyWage: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>임금 지급일</label>
              <input value={form.payDate} onChange={(e) => setForm({ ...form, payDate: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>고정 월급(원)</label>
              <input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>추가근무 시급(원)</label>
              <input type="number" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>임금 지급일</label>
              <input value={form.payDate} onChange={(e) => setForm({ ...form, payDate: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#DDE1D8" }} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-semibold" style={{ color: "#5B6660" }}>사회보험 적용</label>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {([["ei", "고용보험"], ["ni", "국민연금"], ["health", "건강보험"], ["comp", "산재보험"]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-1.5 text-sm" style={{ color: "#3B443E" }}>
                <input type="checkbox" checked={form.insurance[k]} onChange={(e) => setForm({ ...form, insurance: { ...form.insurance, [k]: e.target.checked } })} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>취소</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#1B2420", color: "#F7F8F5" }}>
            저장하고 서명 진행
          </button>
        </div>
      </div>
    </div>
  );
}
