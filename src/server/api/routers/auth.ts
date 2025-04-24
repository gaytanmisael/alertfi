import { loginSchema } from "@/models/Auth";
import { createTRPCRouter, publicProcedure } from "../trpc";

import { RefillingTokenBucket } from "@/server/auth/rate-limit";
import { globalPOSTRateLimit } from "@/server/auth/request";

import { verifyPasswordHash } from "@/server/auth/password";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/auth/session";
import { getUserFromEmail, getUserPasswordHash } from "@/server/auth/user";

import type { SessionFlags } from "@/server/auth/session";
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const headers = ctx.headers;
    const clientIP = headers.get("X-Forwarded-For");

    if (!(await globalPOSTRateLimit())) {
      return {
        message: "Too many requests",
      };
    }

    if (clientIP && !ipBucket.check(clientIP, 1)) {
      return {
        message: "Too many requests",
      };
    }

    const user = await getUserFromEmail(input.email);
    if (!user) {
      return {
        message: "Account does not exist.",
      };
    }

    if (clientIP && !ipBucket.check(clientIP, 1)) {
      return {
        message: "Too many requests",
      };
    }

    const passwordHash = await getUserPasswordHash(user.id);
    const validPassword = await verifyPasswordHash(
      passwordHash,
      input.password,
    );
    if (!validPassword) {
      return {
        message: "Invalid password.",
      };
    }

    return {
      success: true,
      requiresEmailVerification: !user.emailVerified,
    };
  }),
});
