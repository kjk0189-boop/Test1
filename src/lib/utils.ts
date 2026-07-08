export function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayStr(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 신입 크루는 입사 90일 경과 시 자동으로 "일반"으로 승급 (매니저/관리자가 수동으로 바꾼 뒤엔 더 이상 자동 변경하지 않음)
export function shouldAutoPromote(user: { role: string; position: string | null; hireDate: string | null }) {
  if (user.role !== "crew") return false;
  if (user.position !== "신입") return false;
  if (!user.hireDate) return false;
  const hire = new Date(`${user.hireDate}T00:00:00`);
  const days = (Date.now() - hire.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 90;
}
