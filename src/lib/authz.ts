import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import { getSessionFromCookies } from "@/lib/auth";

function roleHome(role: string) {
  if (role === "crew") return "/crew/punch";
  if (role === "manager") return "/manager/dashboard";
  return "/admin/overview";
}

export async function requireUser(expectedRole: "crew" | "manager" | "admin") {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) redirect("/login");

  if (user.mustChangePassword) redirect("/first-password");
  if (user.role !== expectedRole) redirect(roleHome(user.role));

  let store = null;
  if (user.storeId) {
    const [s] = await db.select().from(stores).where(eq(stores.id, user.storeId)).limit(1);
    store = s ?? null;
  }

  return { user, store };
}
