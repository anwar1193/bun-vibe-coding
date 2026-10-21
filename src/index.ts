import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { userRoutes } from "./routes/users-route";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .onError(({ code, error, status }) => {
    if (code === "VALIDATION") return status(422, { message: "Validation failed" });
    if (code === "NOT_FOUND") return status(404, { message: "Not found" });
    console.error(error);
    return status(500, { message: "Internal server error" });
  })
  .get("/", () => ({ message: "Bun + ElysiaJS + Drizzle + MySQL API" }))
  .use(userRoutes)
  .listen(Number(process.env.PORT ?? 3000));

console.log(`Server running at http://localhost:${app.server?.port}`);
