"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { RefillingTokenBucket } from "@/server/auth/rate-limit";
import { globalPOSTRateLimit } from "@/server/auth/request";

import { verifyPasswordHash } from "@/server/auth/password";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/auth/session";
import { getUserFromEmail, getUserPasswordHash } from "@/server/auth/user";

import type { SessionFlags } from "@/server/auth/session";
import type { LoginSchema } from "@/models/Auth";

const ipBucket = new RefillingTokenBucket<string>(20, 1);
interface ActionResult {
  message: string;
}

export async function loginAction(
  _prev: ActionResult,
  form: LoginSchema,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) {
    return {
      message: "Too many requests",
    };
  }
  // TODO: Assumes X-Forwarded-For is always included.
  const headerList = await headers();
  const clientIP = headerList.get("X-Forwarded-For");
  if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
    return {
      message: "Too many requests",
    };
  }

  const user = await getUserFromEmail(form.email);
  if (user === null) return { message: "Account does not exist." };

  if (clientIP !== null && !ipBucket.consume(clientIP, 1))
    return { message: " Too many requests" };

  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, form.password);
  if (!validPassword) return { message: "Invalid Password" };

  const sessionFlags: SessionFlags = {
    twoFactorVerified: false,
  };
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, sessionFlags);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  if (!user.emailVerified) {
    return redirect("/verify-email");
  }
  return redirect("/");
}
