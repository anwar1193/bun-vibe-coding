import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser } from "../services/users-service";

// Regex permisif: menerima domain tanpa TLD (mis. "eko@localhost") agar
// contoh pada issue tetap valid. Cukup untuk mencegah input yang jelas salah.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

// Mengambil token dari header "Authorization: Bearer <token>".
// Case-insensitive terhadap kata "Bearer" sesuai keputusan desain.
function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;

  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .post(
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
  )
  .post(
    "/login",
    async ({ body, status }) => {
      const result = await loginUser(body);

      if (!result.ok) {
        return status(401, { error: "Email atau Password Salah" });
      }

      return status(200, { data: result.token });
    },
    {
      body: t.Object({
        email: t.String({ pattern: EMAIL_PATTERN.source }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  .get("/current", async ({ headers, status }) => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      return status(401, { error: "Unauthorized" });
    }

    const result = await getCurrentUser(token);

    if (!result.ok) {
      return status(401, { error: "Unauthorized" });
    }

    return status(200, { data: result.user });
  });
