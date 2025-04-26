"use server";

import { redirect } from "next/navigation";

import { globalPOSTRateLimit } from "@/server/auth/request";

import {
  createEmailVerificationRequest,
  deleteEmailVerificationRequestCookie,
  deleteUserEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "@/server/auth/email-verification";

import { invalidateUserPasswordResetSessions } from "@/server/auth/password-reset";
import { getCurrentSession } from "@/server/auth/session";
import { updateUserEmailAndSetEmailAsVerified } from "@/server/auth/user";

import type { VerifyValidateOTPSchema } from "@/models/Auth";

interface ActionResult {
  message: string;
}

export async function verifyEmailAction(
  _prev: ActionResult,
  form: VerifyValidateOTPSchema,
): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) return { message: "Too many requests" };

  const { session, user } = await getCurrentSession();
  if (session === null) return { message: "Not Authenticated" };

  let verificationRequest = await getUserEmailVerificationRequestFromRequest();
  if (verificationRequest === null) return { message: "Not Authenticated" };

  const { code } = form;
  if (Date.now() >= verificationRequest.expiresAt.getTime()) {
    verificationRequest = await createEmailVerificationRequest(
      verificationRequest.userId,
      verificationRequest.email,
    );
    sendVerificationEmail(verificationRequest.email, verificationRequest.code);
    return {
      message:
        "The verification code was expired. We sent another code to your inbox.",
    };
  }

  if (verificationRequest.code !== code) return { message: "Incorrect code" };

  await deleteUserEmailVerificationRequest(user.id);
  await invalidateUserPasswordResetSessions(user.id);
  await updateUserEmailAndSetEmailAsVerified(
    user.id,
    verificationRequest.email,
  );
  await deleteEmailVerificationRequestCookie();

  return redirect("/");
}

export async function resendEmailVerificationCodeAction(): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (session === null) return { message: "Not Authenticated" };

  let verificationRequest = await getUserEmailVerificationRequestFromRequest();
  if (verificationRequest === null) {
    if (user.emailVerified) return { message: "Forbidden" };

    verificationRequest = await createEmailVerificationRequest(
      user.id,
      user.email,
    );
  } else {
    verificationRequest = await createEmailVerificationRequest(
      user.id,
      verificationRequest.email,
    );
  }

  sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  await setEmailVerificationRequestCookie(verificationRequest);

  return { message: "A new code was sent to your inbox." };
}
