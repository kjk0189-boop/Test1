import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

function roleHome(role: string) {
  if (role === "crew") return "/crew/punch";
  if (role === "manager") return "/manager/dashboard";
  return "/admin/overview";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 정적 파일, API, 공개 경로는 미들웨어에서 리다이렉트하지 않음 (API는 각 라우트에서 자체 인증)
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  }

  // 역할별 경로 접근 제한 (계정 설정 페이지는 공통 허용)
  if (pathname.startsWith("/crew") && session.role !== "crew") {
    return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  }
  if (pathname.startsWith("/manager") && session.role !== "manager") {
    return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  }
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
