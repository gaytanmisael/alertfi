import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { User } from "../db/schema";
import { decrypt, decryptToString, encrypt, encryptString } from "./encryption";
import { hashPassword } from "./password";
import { generateRandomRecoveryCode } from "./utils";

export interface User {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  registered2FA: boolean;
}

export function verifyUsernameInput(username: string): boolean {
  return (
    username.length > 3 && username.length < 32 && username.trim() === username
  );
}

export async function createUser(
  email: string,
  first_name: string,
  last_name: string,
  password: string,
): Promise<User> {
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);
  const username = `${first_name + " " + last_name}`;

  const row = await db
    .insert(User)
    .values({
      email,
      username,
      first_name,
      last_name,
      password_hash: passwordHash,
      recovery_code: encryptedRecoveryCode,
    })
    .returning({ id: User.id })
    .get();

  if (!row) throw new Error("Unexpected error creating user");

  const user: User = {
    id: row.id,
    username,
    email,
    emailVerified: false,
    registered2FA: false,
  };

  return user;
}

export async function updateUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  // db.execute("UPDATE user SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
  await db
    .update(User)
    .set({ password_hash: passwordHash })
    .where(eq(User.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(
  userId: string,
  email: string,
): Promise<void> {
  // db.execute("UPDATE user SET email = ?, email_verified = 1 WHERE id = ?", [email, userId]);
  await db
    .update(User)
    .set({ email, email_verified: true })
    .where(eq(User.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(
  userId: string,
  email: string,
): Promise<boolean> {
  // const result = db.execute("UPDATE user SET email_verified = 1 WHERE id = ? AND email = ?", [userId, email]);
  const result = await db
    .update(User)
    .set({ email_verified: true })
    .where(and(eq(User.id, userId), eq(User.email, email)));
  return result.rowsAffected > 0;
}

export async function getUserPasswordHash(userId: string): Promise<string> {
  // const row = db.queryOne("SELECT password_hash FROM user WHERE id = ?", [userId]);
  const row = await db
    .select({ password_hash: User.password_hash })
    .from(User)
    .where(eq(User.id, userId))
    .get();
  if (!row) {
    throw new Error("Invalid user ID");
  }
  return row.password_hash;
}

export async function getUserRecoverCode(userId: string): Promise<string> {
  // const row = db.queryOne("SELECT recovery_code FROM user WHERE id = ?", [userId]);
  const row = await db
    .select({ recovery_code: User.recovery_code })
    .from(User)
    .where(eq(User.id, userId))
    .get();
  if (!row) {
    throw new Error("Invalid user ID");
  }
  return decryptToString(row.recovery_code as Uint8Array);
}

export async function getUserTOTPKey(
  userId: string,
): Promise<Uint8Array | null> {
  // const row = db.queryOne("SELECT totp_key FROM user WHERE id = ?", [userId]);
  const row = await db
    .select({ totp_key: User.totp_key })
    .from(User)
    .where(eq(User.id, userId))
    .get();
  if (!row) {
    throw new Error("Invalid user ID");
  }

  return decrypt(row.totp_key as Uint8Array);
}

export async function updateUserTOTPKey(userId: string, key: Uint8Array) {
  const encrypted = encrypt(key);
  await db.update(User).set({ totp_key: encrypted }).where(eq(User.id, userId));
  // db.execute("UPDATE user SET totp_key = ? WHERE id = ?", [encrypted, userId]);
}

export async function resetUserRecoveryCode(userId: string): Promise<string> {
  const recoveryCode = generateRandomRecoveryCode();
  const encrypted = encryptString(recoveryCode);
  // db.execute("UPDATE user SET recovery_code = ? WHERE id = ?", [encrypted, userId]);
  await db
    .update(User)
    .set({ recovery_code: encrypted })
    .where(eq(User.id, userId));
  return recoveryCode;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
  // const row = db.queryOne(
  // 	"SELECT id, email, username, email_verified, IIF(totp_key IS NOT NULL, 1, 0) FROM user WHERE email = ?",
  // 	[email]
  // );
  const row = await db
    .select({
      id: User.id,
      email: User.email,
      username: User.username,
      email_verified: User.email_verified,
      registered2FA: User.totp_key,
    })
    .from(User)
    .where(and(eq(User.email, email), eq(User.is_active, true)))
    .get();

  if (!row) {
    return null;
  }

  const user: User = {
    id: row.id,
    email: row.email,
    username: row.username,
    emailVerified: Boolean(row.email_verified),
    registered2FA: Boolean(row.registered2FA),
  };
  return user;
}
