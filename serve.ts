import { serve } from "@hono/node-server";
import { Hono, TypedResponse } from "hono";
import { StatusCode } from "hono/utils/http-status";

const contextVariables = {};
const ERROR_RESPONSES = {
  NOT_FOUND: { message: "Not found", code: 404 },
  INTERNAL: { message: "Not found", code: 500 },
} as const;

export type PublicContextVariables = typeof contextVariables & {
  ok: <TData>(
    data: TData,
    meta?: {
      count?: number;
    }
  ) => Response &
    TypedResponse<
      { data: TData; meta?: { count?: number } },
      StatusCode,
      "json"
    >;
  fail: (
    errorName: "NOT_FOUND" | "INTERNAL"
  ) => Response &
    TypedResponse<
      { error: (typeof ERROR_RESPONSES)[typeof errorName] },
      StatusCode,
      "json"
    >;
};

const app = new Hono<{ Variables: PublicContextVariables }>();
const routes = app
  .use((ctx, next) => {
    Object.entries(contextVariables).forEach(([name, value]) => {
      ctx.set(name as never, value as never);
    });
    ctx.set("ok", (data, meta) => ctx.json({ data, meta }));
    ctx.set("fail", (errorName) =>
      ctx.json(
        { error: ERROR_RESPONSES[errorName] },
        ERROR_RESPONSES[errorName].code
      )
    );

    return next();
  })
  .get("/ping", ({ var: { ok } }) => ok({ hello: "world" }));

serve({
  fetch: app.fetch,
  port: 4000,
});
