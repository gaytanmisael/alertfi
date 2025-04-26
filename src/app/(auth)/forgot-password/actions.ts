"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { RefillingTokenBucket } from "@/server/auth/rate-limit";
import { globalPOSTRateLimit } from "@/server/auth/request";

import {
  createPasswordResetSession,
  invalidateUserPasswordResetSessions,
  sendPasswordResetEmail,
  setPasswordResetSessionTokenCookie,
} from "@/server/auth/password-reset";
import { generateSessionToken } from "@/server/auth/session";
import { getUserFromEmail } from "@/server/auth/user";

import type { ForgotPasswordSchema } from "@/models/Auth";

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);

interface ActionResult {
  message: string;
}

export async function forgotPasswordAction(
  _prev: ActionResult,
  form: ForgotPasswordSchema,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) {
    return {
      message: "Too many requests",
    };
  }

  const headerList = await headers();
  const clientIP = headerList.get("X-Forwarded-For");
  if (clientIP !== null && !passwordResetEmailIPBucket.check(clientIP, 1))
    return { message: "Too many requests" };

  const user = await getUserFromEmail(form.email);
  if (user === null) return { message: "Account does not exist" };

  if (clientIP !== null && !passwordResetEmailIPBucket.consume(clientIP, 1)) {
    return {
      message: "Too many requests",
    };
  }

  await invalidateUserPasswordResetSessions(user.id);
  const sessionToken = generateSessionToken();
  const session = await createPasswordResetSession(
    sessionToken,
    user.id,
    user.email,
  );

  sendPasswordResetEmail(session.email, session.code);
  await setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
  return redirect("/reset-password/verify-email");
}
