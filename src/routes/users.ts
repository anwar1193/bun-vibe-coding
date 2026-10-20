import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    return db.select().from(users);
  })
  .get(
    "/:id",
    async ({ params, status }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id));

      if (!user) return status(404, { message: "User not found" });
      return user;
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const [result] = await db.insert(users).values(body);
        const [created] = await db
          .select()
          .from(users)
          .where(eq(users.id, result.insertId));
        return status(201, created);
      } catch (error) {
        const cause = (error as { cause?: { code?: string } })?.cause;
        if (cause?.code === "ER_DUP_ENTRY") {
          return status(409, { message: "Email already exists" });
        }
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, status }) => {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id));

      if (!existing) return status(404, { message: "User not found" });

      try {
        await db.update(users).set(body).where(eq(users.id, params.id));
      } catch (error) {
        const cause = (error as { cause?: { code?: string } })?.cause;
        if (cause?.code === "ER_DUP_ENTRY") {
          return status(409, { message: "Email already exists" });
        }
        throw error;
      }

      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id));
      return updated;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, status }) => {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id));

      if (!existing) return status(404, { message: "User not found" });

      await db.delete(users).where(eq(users.id, params.id));
      return status(200, { message: "User deleted" });
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  );
