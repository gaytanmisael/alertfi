import { db } from "../db";
import { User } from "../db/schema";
import { eq, count } from "drizzle-orm";

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const row = await db
    .select({ count: count() })
    .from(User)
    .where(eq(User.email, email))
    .get();
  return row?.count === 0;
}
