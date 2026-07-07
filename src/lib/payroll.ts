// 근로기준법 가산수당 계산 유틸
// - 휴게시간: 4시간↑ 30분 / 8시간↑ 1시간 (무급, 자동 차감)
// - 연장근로: 1일 실근무 8시간 초과분 ×1.5
// - 야간근로: 22:00~06:00 근무 ×0.5 가산(중복 지급)
// - 휴일근로: 소정 휴일 근무 8시간까지 ×1.5, 초과분 ×2.0
// - 주휴수당: 해당 주 실근무 15시간↑ 시 (min(주근무,40)/40)×8×시급
// ※ 소정근로일/스케줄 정보가 없어 "실근무시간" 기준으로 근사 계산합니다.

export type Shift = {
  dateStr: string;
  grossMin: number;
  breakMin: number;
  netMin: number;
  isHoliday: boolean;
  nightMin: number;
  regularMin: number;
  otMin: number;
  holRegMin: number;
  holOtMin: number;
};

export type ShiftPay = Shift & { basePay: number; nightPay: number; total: number };

function nightOverlapMinutes(inMs: number, outMs: number) {
  let total = 0;
  const start = new Date(inMs);
  const end = new Date(outMs);
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + 1);
  while (d <= limit) {
    const nightStart = new Date(d);
    nightStart.setHours(22, 0, 0, 0);
    const nightEnd = new Date(d);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 0, 0, 0);
    const os = Math.max(start.getTime(), nightStart.getTime());
    const oe = Math.min(end.getTime(), nightEnd.getTime());
    if (oe > os) total += (oe - os) / 60000;
    d.setDate(d.getDate() + 1);
  }
  return total;
}

export function mondayOf(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function analyzeShift(dateStr: string, checkInMs: number, checkOutMs: number, holidayDow: number): Shift {
  const grossMin = Math.max(0, (checkOutMs - checkInMs) / 60000);
  const breakMin = grossMin >= 480 ? 60 : grossMin >= 240 ? 30 : 0;
  const netMin = Math.max(0, grossMin - breakMin);
  const dow = new Date(`${dateStr}T00:00:00`).getDay();
  const isHoliday = dow === holidayDow;
  const nightMin = Math.min(nightOverlapMinutes(checkInMs, checkOutMs), netMin);

  let regularMin = 0, otMin = 0, holRegMin = 0, holOtMin = 0;
  if (isHoliday) {
    holRegMin = Math.min(netMin, 480);
    holOtMin = Math.max(0, netMin - 480);
  } else {
    regularMin = Math.min(netMin, 480);
    otMin = Math.max(0, netMin - 480);
  }
  return { dateStr, grossMin, breakMin, netMin, isHoliday, nightMin, regularMin, otMin, holRegMin, holOtMin };
}

export function payForShift(shift: Shift, wage: number): { basePay: number; nightPay: number; total: number } {
  const basePay =
    (shift.regularMin / 60) * wage +
    (shift.otMin / 60) * wage * 1.5 +
    (shift.holRegMin / 60) * wage * 1.5 +
    (shift.holOtMin / 60) * wage * 2.0;
  const nightPay = (shift.nightMin / 60) * wage * 0.5;
  return { basePay, nightPay, total: basePay + nightPay };
}

export type MonthlyPayroll = {
  daily: ShiftPay[];
  weeklyAllowanceTotal: number;
  totals: { netMin: number; otMin: number; nightMin: number; holMin: number; basePay: number; nightPay: number };
  grandTotal: number;
};

export function computeMonthlyPayroll(
  records: { date: string; checkIn: string | Date | null; checkOut: string | Date | null }[],
  wage: number,
  holidayDow: number
): MonthlyPayroll {
  const shifts: Shift[] = records
    .filter((r) => r.checkIn && r.checkOut)
    .map((r) => analyzeShift(r.date, new Date(r.checkIn as string).getTime(), new Date(r.checkOut as string).getTime(), holidayDow));

  const daily: ShiftPay[] = shifts.map((s) => ({ ...s, ...payForShift(s, wage) }));

  const byWeek: Record<string, number> = {};
  shifts.forEach((s) => {
    const wk = mondayOf(s.dateStr);
    byWeek[wk] = (byWeek[wk] || 0) + s.netMin;
  });
  let weeklyAllowanceTotal = 0;
  Object.values(byWeek).forEach((netMin) => {
    const hours = netMin / 60;
    if (hours >= 15) weeklyAllowanceTotal += (Math.min(hours, 40) / 40) * 8 * wage;
  });

  const totals = daily.reduce(
    (acc, d) => {
      acc.netMin += d.netMin;
      acc.otMin += d.otMin;
      acc.nightMin += d.nightMin;
      acc.holMin += d.holRegMin + d.holOtMin;
      acc.basePay += d.basePay;
      acc.nightPay += d.nightPay;
      return acc;
    },
    { netMin: 0, otMin: 0, nightMin: 0, holMin: 0, basePay: 0, nightPay: 0 }
  );

  const grandTotal = Math.round(totals.basePay + totals.nightPay + weeklyAllowanceTotal);

  return { daily, weeklyAllowanceTotal: Math.round(weeklyAllowanceTotal), totals, grandTotal };
}

export function durationLabel(ms: number) {
  if (ms < 0) return "-";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}
