import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { users, sessions } from "../db/schema";

const SALT_ROUNDS = 10;

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult =
  | { ok: true }
  | { ok: false; reason: "EMAIL_TAKEN" };

export async function registerUser(
  input: RegisterUserInput,
): Promise<RegisterUserResult> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email));

  if (existing) {
    return { ok: false, reason: "EMAIL_TAKEN" };
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  await db.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return { ok: true };
}

export type LoginUserInput = {
  email: string;
  password: string;
};

export type LoginUserResult =
  | { ok: true; token: string }
  | { ok: false; reason: "INVALID_CREDENTIALS" };

export async function loginUser(
  input: LoginUserInput,
): Promise<LoginUserResult> {
  const [user] = await db
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(eq(users.email, input.email));

  if (!user) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  await db.delete(sessions).where(eq(sessions.userId, user.id));

  const token = uuidv4();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { ok: true, token };
}

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type GetCurrentUserResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; reason: "UNAUTHORIZED" };

export async function getCurrentUser(
  token: string,
): Promise<GetCurrentUserResult> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m-%d %H:%i:%s')`,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));

  if (!row) {
    return { ok: false, reason: "UNAUTHORIZED" };
  }

  return { ok: true, user: row };
}

export type LogoutUserResult =
  | { ok: true }
  | { ok: false; reason: "UNAUTHORIZED" };

export async function logoutUser(
  token: string,
): Promise<LogoutUserResult> {
  const [result] = await db
    .delete(sessions)
    .where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    return { ok: false, reason: "UNAUTHORIZED" };
  }

  return { ok: true };
}
