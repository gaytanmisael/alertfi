"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { RefillingTokenBucket } from "@/server/auth/rate-limit";
import { globalPOSTRateLimit } from "@/server/auth/request";

import { checkEmailAvailability } from "@/server/auth/email";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "@/server/auth/email-verification";
import { verifyPasswordStrength } from "@/server/auth/password";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/auth/session";
import { createUser } from "@/server/auth/user";

import type { SessionFlags } from "@/server/auth/session";
import type { RegisterSchema } from "@/models/Auth";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

interface ActionResult {
  message: string;
}

export async function registerAction(
  _prev: ActionResult,
  form: RegisterSchema,
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

  const emailAvailable = await checkEmailAvailability(form.email);
  if (!emailAvailable) {
    return { message: "Email is already in use." };
  }

  const strongPassword = await verifyPasswordStrength(form.password);
  if (!strongPassword) {
    return { message: "Password is not strong enough." };
  }

  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return {
      message: "Too many requests",
    };
  }

  const user = await createUser(
    form.email,
    form.first_name,
    form.last_name,
    form.password,
  );
  const emailVerificationRequest = await createEmailVerificationRequest(
    user.id,
    user.email,
  );
  sendVerificationEmail(
    emailVerificationRequest.email,
    emailVerificationRequest.code,
  );
  await setEmailVerificationRequestCookie(emailVerificationRequest);

  const sessionFlags: SessionFlags = {
    twoFactorVerified: false,
  };

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, sessionFlags);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  return redirect("/verify-email");
}
