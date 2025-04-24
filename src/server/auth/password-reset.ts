import { db } from "../db";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";
import { cookies } from "next/headers";

import type { User as dbUser } from "./user";
import { Password_Reset_Session, User } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export interface PasswordResetSession {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  code: string;
  emailVerified: boolean;
  twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
  | { session: PasswordResetSession; user: dbUser }
  | { session: null; user: null };

export async function createPasswordResetSession(
  token: string,
  userId: string,
  email: string,
): Promise<PasswordResetSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: PasswordResetSession = {
    id: sessionId,
    userId,
    email,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    code: generateRandomOTP(),
    emailVerified: false,
    twoFactorVerified: false,
  };

  // db.execute("INSERT INTO password_reset_session (id, user_id, email, code, expires_at) VALUES (?, ?, ?, ?, ?)", [
  // 	session.id,
  // 	session.userId,
  // 	session.email,
  // 	session.code,
  // 	Math.floor(session.expiresAt.getTime() / 1000)
  // ]);
  await db.insert(Password_Reset_Session).values({
    id: session.id,
    user_id: session.userId,
    email: session.email,
    code: session.code,
    expires_at: session.expiresAt,
  });
  return session;
}

export async function validatePasswordResetSessionToken(
  token: string,
): Promise<PasswordResetSessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  //   const row = db.queryOne(
  //     `SELECT password_reset_session.id, password_reset_session.user_id, password_reset_session.email, password_reset_session.code, password_reset_session.expires_at, password_reset_session.email_verified, password_reset_session.two_factor_verified,
  // user.id, user.email, user.username, user.email_verified, IIF(user.totp_key IS NOT NULL, 1, 0)
  // FROM password_reset_session INNER JOIN user ON user.id = password_reset_session.user_id
  // WHERE password_reset_session.id = ?`,
  //     [sessionId],
  //   );
  const row = await db
    .select({
      id: Password_Reset_Session.id,
      userId: Password_Reset_Session.user_id,
      email: Password_Reset_Session.email,
      code: Password_Reset_Session.code,
      expires_at: Password_Reset_Session.expires_at,
      two_factor_verified: Password_Reset_Session.two_factor_verified,
      username: User.username,
      email_verified: User.email_verified,
      registered2FA: sql`IIF(${User.totp_key} IS NOT NULL, 1, 0)`,
    })
    .from(Password_Reset_Session)
    .innerJoin(User, eq(Password_Reset_Session.user_id, User.id))
    .where(eq(Password_Reset_Session.id, sessionId))
    .get();
  if (!row) {
    return { session: null, user: null };
  }

  const session: PasswordResetSession = {
    id: row.id,
    userId: row.userId!,
    email: row.email,
    code: row.code,
    expiresAt: new Date(row.expires_at.getTime() * 1000),
    emailVerified: row.email_verified,
    twoFactorVerified: row.two_factor_verified!,
  };

  const user: dbUser = {
    id: row.userId!,
    email: row.email,
    username: row.username,
    emailVerified: row.email_verified,
    registered2FA: Boolean(row.registered2FA),
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    // db.execute("DELETE FROM password_reset_session WHERE id = ?", [session.id]);
    await db
      .delete(Password_Reset_Session)
      .where(eq(Password_Reset_Session.id, session.id));
    return { session: null, user: null };
  }

  return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(
  sessionId: string,
) {
  // db.execute(
  //   "UPDATE password_reset_session SET email_verified = 1 WHERE id = ?",
  //   [sessionId],
  // );
  await db
    .update(Password_Reset_Session)
    .set({ email_verified: true })
    .where(eq(Password_Reset_Session.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
  // db.execute(
  //   "UPDATE password_reset_session SET two_factor_verified = 1 WHERE id = ?",
  //   [sessionId],
  // );
  await db
    .update(Password_Reset_Session)
    .set({ two_factor_verified: true })
    .where(eq(Password_Reset_Session.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: string) {
  // db.execute("DELETE FROM password_reset_session WHERE user_id = ?", [userId]);
  await db
    .delete(Password_Reset_Session)
    .where(eq(Password_Reset_Session.user_id, userId));
}

export async function validatePasswordResetSessionRequest(): Promise<PasswordResetSessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("password_reset_session")?.value ?? null;
  if (token === null) {
    return { session: null, user: null };
  }

  const result = await validatePasswordResetSessionToken(token);
  if (result.session === null) {
    await deletePasswordResetSessionTokenCookie();
  }

  return result;
}

export async function setPasswordResetSessionTokenCookie(
  token: string,
  expiresAt: Date,
) {
  const cookieStore = await cookies();
  cookieStore.set("password_reset_session", token, {
    expires: expiresAt,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function deletePasswordResetSessionTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.set("password_reset_session", "", {
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function sendPasswordResetEmail(email: string, code: string): void {
  console.log(`To ${email}: Your reset code is ${code}`);
}
