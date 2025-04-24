// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  sqliteTableCreator,
  int,
  text,
  blob,
  real,
} from "drizzle-orm/sqlite-core";

import { v4 as uuid } from "uuid";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `alertfi_${name}`);

export const User = createTable(
  "user",
  {
    id: text("id").primaryKey().unique().default(uuid()),
    first_name: text("first_name", { length: 512 }),
    last_name: text("last_name", { length: 512 }),
    email: text("email", { length: 512 }).unique().notNull(),
    username: text("username", { length: 512 }).unique().notNull(),
    password_hash: text("password_hash", { length: 256 }).notNull(),
    email_verified: int("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    recovery_code: blob("recovery_code"),
    totp_key: blob("totp_key"),
    is_active: int("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    email_index: index("email_index").on(table.email),
  }),
);

export const Session = createTable("session", {
  id: text("id").primaryKey().unique().default(uuid()),
  user_id: text("user_id").references(() => User.id),
  expires_at: int("expires_at", { mode: "number" }).notNull(),
  two_factor_verified: int("two_factor_verified", { mode: "boolean" }).default(
    false,
  ),
});

export const Email_Verification_Request = createTable(
  "email_verification_request",
  {
    id: text("id").primaryKey().unique().default(uuid()),
    user_id: text("user_id").references(() => User.id),
    email: text("email", { length: 256 }).notNull(),
    code: text("code", { length: 256 }).notNull(),
    expires_at: int("expires_at", { mode: "timestamp" }).notNull(),
  },
);

export const Password_Reset_Session = createTable("password_reset_session", {
  id: text("id").primaryKey().unique().default(uuid()),
  user_id: text("user_id").references(() => User.id),
  email: text("email", { length: 256 }).notNull(),
  code: text("code", { length: 256 }).notNull(),
  expires_at: int("expires_at", { mode: "timestamp" }).notNull(),
  email_verified: int("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  two_factor_verified: int("two_factor_verified", { mode: "boolean" }).default(
    false,
  ),
});

export const Alert = createTable("alert", {
  id: text("id").primaryKey().unique().default(uuid()),
  user_id: text("user_id").references(() => User.id),
  symbol: text("symbol").notNull(), // Coin Symbol
  target_price: real("target_price").notNull(), // Price threshold
  direction: text("direction").notNull(), // "above" or "below"
  is_active: int("is_active", { mode: "boolean" }).default(true).notNull(),
  triggered: int("triggered", { mode: "boolean" }).default(false).notNull(),
  triggered_at: int("triggered_at", { mode: "timestamp" }),

  created_at: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updated_at: int("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});

export const AlertLog = createTable("alert_log", {
  id: text("id").primaryKey().unique().default(uuid()),

  alert_id: text("alert_id")
    .notNull()
    .references(() => Alert.id),
  user_id: text("user_id")
    .notNull()
    .references(() => User.id),

  symbol: text("symbol").notNull(),
  price_at_trigger: real("price_at_trigger").notNull(),

  triggered_at: int("triggered_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),

  channel: text("channel").default("telegram"), // "telegram", "email", etc.
  sent_successfully: int("sent_successfully", { mode: "boolean" }).default(
    true,
  ),
  message_id: text("message_id"),
  response_time_ms: int("response_time_ms"),
  attempts: int("attempts").default(1),
  error_message: text("error_message"),
  metadata: text("metadata"), // Optional JSON blob

  created_at: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const Coin = createTable("coin", {
  id: text("id").primaryKey().unique(), // CoinGecko ID (e.g. "bitcoin")
  symbol: text("symbol").unique().notNull(), // "btc"
  name: text("name").notNull(), // "Bitcoin"
  image_url: text("image_url"),

  last_updated: int("last_updated", { mode: "timestamp" }),
});
