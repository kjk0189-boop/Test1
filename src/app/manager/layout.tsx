import Shell from "@/components/Shell";
import { requireUser } from "@/lib/authz";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, store } = await requireUser("manager");

  return (
    <Shell
      role="manager"
      userName={user.name}
      storeName={store?.name}
      navItems={[
        { key: "dashboard", label: "출근 현황", href: "/manager/dashboard" },
        { key: "attendance", label: "근태 관리", href: "/manager/attendance" },
        { key: "crew", label: "크루원 관리", href: "/manager/crew" },
        { key: "contracts", label: "근로계약서", href: "/manager/contracts" },
        { key: "my-contract", label: "내 근로계약서", href: "/manager/my-contract" },
        { key: "my-payslips", label: "내 급여명세서", href: "/manager/my-payslips" },
        { key: "payroll", label: "급여 관리", href: "/manager/payroll" },
        { key: "qr", label: "매장 QR", href: "/manager/qr" },
      ]}
    >
      {children}
    </Shell>
  );
}
