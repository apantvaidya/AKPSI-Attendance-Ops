import { cookies } from "next/headers";

const DEV_AUTH_COOKIE = "dev-auth-email";

export function isDevAuthEnabled() {
  return process.env.DEV_AUTH_BYPASS_ENABLED === "true";
}

export async function getDevAuthEmail() {
  if (!isDevAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(DEV_AUTH_COOKIE)?.value?.toLowerCase() ?? null;
}

export async function setDevAuthEmail(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEV_AUTH_COOKIE, email.toLowerCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearDevAuthEmail() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE);
}
