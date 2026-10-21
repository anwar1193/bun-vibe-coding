import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

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
