import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/server/db/schema";
import { User } from "@/server/db/schema";
import { hash } from "@node-rs/argon2";

import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

const client =
  globalForDb.client ??
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

const db = drizzle(client, { schema });

async function main() {
  const passwordHash = await hash("Mgaytan@94", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  await db.insert(User).values([
    {
      first_name: "Misael",
      last_name: "Gaytan",
      email: "gaytanmisael@gmail.com",
      is_active: true,
      username: "Misael Gaytan",
      password_hash: passwordHash,
    },
  ]);
}

await main();
