"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChangePasswordModal from "./ChangePasswordModal";

const ROLE_LABEL: Record<string, string> = { crew: "크루원", manager: "매니저", admin: "관리자" };

export type NavItem = { key: string; label: string; href: string };

export default function Shell({
  role,
  userName,
  storeName,
  navItems,
  children,
}: {
  role: string;
  userName: string;
  storeName?: string | null;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="p-3 space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: active ? "#1B2420" : "transparent",
              color: active ? "#F7F8F5" : "#3B443E",
            }}
          >
            <span className="flex-1 text-left">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const FooterBlock = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="p-3 border-t" style={{ borderColor: "#DDE1D8" }}>
      <button
        onClick={() => { onNavigate?.(); setAccountOpen(true); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{ color: "#5B6660" }}
      >
        계정 설정 (비밀번호 변경)
      </button>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg mt-1" style={{ background: "#EEF0EA" }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#1B2420" }}>{userName}</div>
          <div className="text-xs" style={{ color: "#5B6660" }}>
            {ROLE_LABEL[role]}
            {storeName ? ` · ${storeName}` : ""}
          </div>
        </div>
        <button onClick={handleLogout} className="text-xs font-semibold" style={{ color: "#A64B3A" }}>
          로그아웃
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex">
      <aside className="w-60 shrink-0 hidden md:flex flex-col justify-between border-r" style={{ borderColor: "#DDE1D8", background: "#F7F8F5" }}>
        <div>
          <div className="px-5 py-5 flex items-center gap-2 border-b" style={{ borderColor: "#DDE1D8" }}>
            <span className="font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>Punch</span>
          </div>
          <NavList />
        </div>
        <FooterBlock />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: "rgba(27,36,32,0.5)" }} onClick={() => setMobileNavOpen(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-72 flex flex-col justify-between"
            style={{ background: "#F7F8F5", maxWidth: "85%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: "#DDE1D8" }}>
                <span className="font-bold" style={{ color: "#1B2420", fontFamily: "var(--font-display)" }}>Punch</span>
                <button onClick={() => setMobileNavOpen(false)} style={{ color: "#5B6660" }}>✕</button>
              </div>
              <NavList onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <FooterBlock onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3.5 border-b md:hidden" style={{ borderColor: "#DDE1D8", background: "#F7F8F5" }}>
          <button onClick={() => setMobileNavOpen(true)} className="p-1 -ml-1" aria-label="메뉴 열기" style={{ color: "#1B2420" }}>☰</button>
          <div className="flex-1 min-w-0 text-center">
            <div className="font-bold text-sm truncate" style={{ color: "#1B2420" }}>
              {userName} · {ROLE_LABEL[role]}{storeName ? ` · ${storeName}` : ""}
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs font-semibold shrink-0" style={{ color: "#A64B3A" }}>로그아웃</button>
        </header>
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>

      {accountOpen && <ChangePasswordModal onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
