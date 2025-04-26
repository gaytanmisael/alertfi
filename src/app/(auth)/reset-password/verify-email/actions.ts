"use server";

import { redirect } from "next/navigation";

import { globalPOSTRateLimit } from "@/server/auth/request";

import {
  setPasswordResetSessionAsEmailVerified,
  validatePasswordResetSessionRequest,
} from "@/server/auth/password-reset";
import { setUserAsEmailVerifiedIfEmailMatches } from "@/server/auth/user";

import type { VerifyValidateOTPSchema } from "@/models/Auth";

interface ActionResult {
  message: string;
}

export async function verifyPasswordResetEmailAction(
  _prev: ActionResult,
  form: VerifyValidateOTPSchema,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) return { message: "Too many requests" };

  const { session } = await validatePasswordResetSessionRequest();
  if (session === null) return { message: "Not Authenticated" };

  if (session.emailVerified) return { message: "Forbidden" };

  const { code } = form;
  if (code !== session.code) return { message: "Incorrect Code." };

  await setPasswordResetSessionAsEmailVerified(session.id);
  const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(
    session.userId,
    session.email,
  );
  if (!emailMatches) return { message: "Please restart the process" };

  return redirect("/reset-password");
}
