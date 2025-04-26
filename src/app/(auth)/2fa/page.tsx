import { redirect } from "next/navigation";

import { globalGETRateLimit } from "@/server/auth/request";
import { getCurrentSession } from "@/server/auth/session";

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return "Too many requests";
  }
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect("/login");
  }
  if (!user.emailVerified) {
    return redirect("/verify-email");
  }
  if (!user.registered2FA) {
    return redirect("/2fa/setup");
  }
  if (session.twoFactorVerified) {
    return redirect("/");
  }
}
