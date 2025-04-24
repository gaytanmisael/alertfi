import { generateRandomOTP } from "./utils";
import { db } from "../db";
import { ExpiringTokenBucket } from "./rate-limit";
import { encodeBase32 } from "@oslojs/encoding";
import { cookies } from "next/headers";
import { getCurrentSession } from "./session";
import { Email_Verification_Request } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface EmailVerificationRequest {
  id: string;
  userId: string;
  code: string;
  email: string;
  expiresAt: Date;
}

export const sendVerificationEmailBucket = new ExpiringTokenBucket<number>(
  3,
  60 * 10,
);

export async function getUserEmailVerificationRequest(
  userId: string,
  id: string,
): Promise<EmailVerificationRequest | null> {
  // const row = db.queryOne(
  // 	"SELECT id, user_id, code, email, expires_at FROM email_verification_request WHERE id = ? AND user_id = ?",
  // 	[id, userId]
  // );
  const row = await db
    .select({
      id: Email_Verification_Request.id,
      userId: Email_Verification_Request.user_id,
      code: Email_Verification_Request.code,
      email: Email_Verification_Request.email,
      expiresAt: Email_Verification_Request.expires_at,
    })
    .from(Email_Verification_Request)
    .where(
      and(
        eq(Email_Verification_Request.id, id),
        eq(Email_Verification_Request.user_id, userId),
      ),
    )
    .get();
  if (!row) {
    return null;
  }
  const request: EmailVerificationRequest = {
    id: row.id,
    userId: row.userId!,
    code: row.code,
    email: row.email,
    expiresAt: new Date(Number(row.expiresAt) * 1000),
  };
  return request;
}

export async function createEmailVerificationRequest(
  userId: string,
  email: string,
): Promise<EmailVerificationRequest> {
  await deleteUserEmailVerificationRequest(userId);
  const idBytes = new Uint8Array(20);
  crypto.getRandomValues(idBytes);
  const id = encodeBase32(idBytes).toLowerCase();

  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  // db.queryOne(
  //   "INSERT INTO email_verification_request (id, user_id, code, email, expires_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
  //   [id, userId, code, email, Math.floor(expiresAt.getTime() / 1000)],
  // );
  await db.insert(Email_Verification_Request).values({
    id,
    user_id: userId,
    code,
    email,
    expires_at: expiresAt,
  });

  const request: EmailVerificationRequest = {
    id,
    userId,
    code,
    email,
    expiresAt,
  };
  return request;
}

export async function deleteUserEmailVerificationRequest(userId: string) {
  // db.execute("DELETE FROM email_verification_request WHERE user_id = ?", [
  // userId,
  // ]);
  await db
    .delete(Email_Verification_Request)
    .where(eq(Email_Verification_Request.user_id, userId));
}

export function sendVerificationEmail(email: string, code: string): void {
  console.log(`To ${email}: Your verification code is ${code}`);
}

export async function setEmailVerificationRequestCookie(
  request: EmailVerificationRequest,
) {
  const cookieStore = await cookies();
  cookieStore.set("email_verification", request.id, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: request.expiresAt,
  });
}

export async function deleteEmailVerificationRequestCookie() {
  const cookieStore = await cookies();
  cookieStore.set("email_verification", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function getUserEmailVerificationRequestFromRequest(): Promise<EmailVerificationRequest | null> {
  const { user } = await getCurrentSession();
  if (user === null) {
    return null;
  }

  const cookieStore = await cookies();
  const id = cookieStore.get("email_verification")?.value ?? null;
  if (id === null) {
    return null;
  }

  const request = await getUserEmailVerificationRequest(user.id, id);
  if (request === null) {
    await deleteEmailVerificationRequestCookie();
  }

  return request;
}
