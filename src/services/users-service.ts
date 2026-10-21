import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
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
