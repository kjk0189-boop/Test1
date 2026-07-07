import Shell from "@/components/Shell";
import { requireUser } from "@/lib/authz";

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const { user, store } = await requireUser("crew");

  return (
    <Shell
      role="crew"
      userName={user.name}
      storeName={store?.name}
      navItems={[
        { key: "punch", label: "출/퇴근", href: "/crew/punch" },
        { key: "history", label: "내 근무 기록", href: "/crew/history" },
      ]}
    >
      {children}
    </Shell>
  );
}
