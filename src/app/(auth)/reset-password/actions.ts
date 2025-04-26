"use server";

import { redirect } from "next/navigation";

import { globalPOSTRateLimit } from "@/server/auth/request";

import {
  deletePasswordResetSessionTokenCookie,
  invalidateUserPasswordResetSessions,
  validatePasswordResetSessionRequest,
} from "@/server/auth/password-reset";
import {
  createSession,
  generateSessionToken,
  invalidateUserSessions,
  setSessionTokenCookie,
} from "@/server/auth/session";
import { updateUserPassword } from "@/server/auth/user";
import { verifyPasswordStrength } from "@/server/auth/password";

import type { SessionFlags } from "@/server/auth/session";
import type { NewPasswordSchema } from "@/models/Auth";

interface ActionResult {
  message: string;
}

export async function resetPasswordAction(
  _prev: ActionResult,
  form: NewPasswordSchema,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) return { message: "Too many requests." };

  const { session: passwordResetSession, user } =
    await validatePasswordResetSessionRequest();
  if (passwordResetSession === null) return { message: "Not Authenticated" };

  if (!passwordResetSession.emailVerified) return { message: "Forbidden" };

  const { password } = form;
  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) return { message: "Weak Password" };

  await invalidateUserPasswordResetSessions(passwordResetSession.userId);
  await invalidateUserSessions(passwordResetSession.userId);
  await updateUserPassword(passwordResetSession.userId, password);

  const sessionFlags: SessionFlags = {
    twoFactorVerified: passwordResetSession.twoFactorVerified,
  };

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, sessionFlags);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  await deletePasswordResetSessionTokenCookie();
  return redirect("/");
}
