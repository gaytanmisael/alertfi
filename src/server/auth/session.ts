import { db } from "../db";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { cookies } from "next/headers";
import { cache } from "react";

import type { User as dbUser } from "./user";
import { Session, User } from "../db/schema";
import { eq } from "drizzle-orm";

export interface SessionFlags {
  twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
  id: string;
  expiresAt: Date;
  userId: string;
}

type SessionValidationResult =
  | { session: Session; user: dbUser }
  | { session: null; user: null };

export async function validateSessionToken(
  token: string,
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  //   const row = db.queryOne(
  //     `
  // SELECT session.id, session.user_id, session.expires_at, session.two_factor_verified, user.id, user.email, user.username, user.email_verified, IIF(user.totp_key IS NOT NULL, 1, 0) FROM session
  // INNER JOIN user ON session.user_id = user.id
  // WHERE session.id = ?
  // `,
  //     [sessionId],
  //   );
  const row = await db
    .select({
      sessionId: Session.id,
      userId: Session.user_id,
      expires_at: Session.expires_at,
      two_factor_verified: Session.two_factor_verified,
      email: User.email,
      username: User.username,
      email_verified: User.email_verified,
      registered2FA: User.totp_key,
    })
    .from(Session)
    .innerJoin(User, eq(Session.user_id, User.id))
    .where(eq(Session.id, sessionId))
    .get();
  if (!row) {
    return { session: null, user: null };
  }

  const session: Session = {
    id: row.sessionId,
    userId: row.userId!,
    expiresAt: new Date(row.expires_at * 1000),
    twoFactorVerified: Boolean(row.registered2FA),
  };

  const user: dbUser = {
    id: row.userId!,
    email: row.email,
    username: row.username,
    emailVerified: Boolean(row.email_verified),
    registered2FA: Boolean(row.registered2FA),
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    // db.execute("DELETE FROM session WHERE id = ?", [session.id]);
    await db.delete(Session).where(eq(Session.id, session.id));
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    // db.execute("UPDATE session SET expires_at = ? WHERE session.id = ?", [
    //   Math.floor(session.expiresAt.getTime() / 1000),
    //   session.id,
    // ]);
    await db
      .update(Session)
      .set({ expires_at: Math.floor(session.expiresAt.getTime() / 1000) })
      .where(eq(Session.id, session.id));
  }

  return { session, user };
}

export const getCurrentSession = cache(
  async (): Promise<SessionValidationResult> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value ?? null;
    if (token === null) {
      return { session: null, user: null };
    }
    const result = validateSessionToken(token);
    return result;
  },
);

export async function invalidateSession(sessionId: string): Promise<void> {
  // db.execute("DELETE FROM session WHERE id = ?", [sessionId]);
  await db.delete(Session).where(eq(Session.id, sessionId));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  // db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
  await db.delete(Session).where(eq(Session.user_id, userId));
}

export async function setSessionTokenCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });
}

export async function deleteSessionTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

export function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  const token = encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
  return token;
}

export async function createSession(
  token: string,
  userId: string,
  flags: SessionFlags,
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    twoFactorVerified: flags.twoFactorVerified,
  };

  // db.execute(
  //   "INSERT INTO session (id, user_id, expires_at, two_factor_verified) VALUES (?, ?, ?, ?)",
  //   [
  //     session.id,
  //     session.userId,
  //     Math.floor(session.expiresAt.getTime() / 1000),
  //     Number(session.twoFactorVerified),
  //   ],
  // );
  await db.insert(Session).values({
    id: sessionId,
    user_id: userId,
    expires_at: Math.floor(session.expiresAt.getTime() / 1000),
    two_factor_verified: flags.twoFactorVerified,
  });

  return session;
}

export async function setSessionAs2FAVerified(sessionId: string) {
  // db.execute("UPDATE session SET two_factor_verified = 1 WHERE id = ?", [
  //   sessionId,
  // ]);
  await db
    .update(Session)
    .set({ two_factor_verified: true })
    .where(eq(Session.id, sessionId));
}
