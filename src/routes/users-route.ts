import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-service";

// Regex permisif: menerima domain tanpa TLD (mis. "eko@localhost") agar
// contoh pada issue tetap valid. Cukup untuk mencegah input yang jelas salah.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export const userRoutes = new Elysia({ prefix: "/api/users" }).post(
  "/",
  async ({ body, status }) => {
    const result = await registerUser(body);

    if (!result.ok) {
      return status(409, { error: "Email sudah terdaftar" });
    }

    return status(201, { data: "OK" });
  },
  {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ pattern: EMAIL_PATTERN.source }),
      password: t.String({ minLength: 1 }),
    }),
  },
);
