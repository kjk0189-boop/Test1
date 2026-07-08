import Shell from "@/components/Shell";
import { requireUser } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser("admin");

  return (
    <Shell
      role="admin"
      userName={user.name}
      navItems={[
        { key: "overview", label: "통합 대시보드", href: "/admin/overview" },
        { key: "operate", label: "지점 운영", href: "/admin/operate" },
        { key: "managers", label: "매니저 관리", href: "/admin/managers" },
        { key: "stores", label: "지점 관리", href: "/admin/stores" },
        { key: "payroll-all", label: "전 지점 급여", href: "/admin/payroll-all" },
        { key: "logs", label: "근태 수정 이력", href: "/admin/logs" },
      ]}
    >
      {children}
    </Shell>
  );
}
