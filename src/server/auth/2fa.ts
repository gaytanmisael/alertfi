import { db } from "../db";
import { Session, User } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { decryptToString, encryptString } from "./encryption";
import { ExpiringTokenBucket } from "./rate-limit";
import { generateRandomRecoveryCode } from "./utils";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(
  userId: string,
  recoveryCode: string,
): Promise<boolean> {
  // Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
  const row = await db
    .select({ recovery_code: User.recovery_code })
    .from(User)
    .where(eq(User.id, userId))
    .get();
  // const row = db.queryOne("SELECT recovery_code FROM user WHERE id = ?", [userId]);
  if (!row) {
    return false;
  }

  const userRecoveryCode = decryptToString(row.recovery_code as Uint8Array);
  if (recoveryCode !== userRecoveryCode) {
    return false;
  }

  const newRecoveryCode = generateRandomRecoveryCode();
  const encryptedNewRecoveryCode = encryptString(newRecoveryCode);

  await db
    .update(Session)
    .set({ two_factor_verified: false })
    .where(eq(Session.user_id, userId));

  // db.execute("UPDATE session SET two_factor_verified = 0 WHERE user_id = ?", [
  //   userId,
  // ]);
  // Compare old recovery code to ensure recovery code wasn't updated.
  // const result = db.execute(
  //   "UPDATE user SET recovery_code = ?, totp_key = NULL WHERE id = ? AND recovery_code = ?",
  //   [encryptedNewRecoveryCode, userId, encryptedRecoveryCode],
  // );

  const result = await db
    .update(User)
    .set({ recovery_code: encryptedNewRecoveryCode, totp_key: null })
    .where(and(eq(User.id, userId), eq(User.recovery_code, row.recovery_code)));
  return result.rowsAffected > 0;
}
