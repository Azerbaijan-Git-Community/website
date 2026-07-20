import z from "zod";
import { clientEnvSchema } from "./env.client";

const serverEnvSchema = z.object({
  ...clientEnvSchema.shape,
  DATABASE_URL: z.string().min(3),
  DIRECT_URL: z.string().min(3),
  BETTER_AUTH_SECRET_V1: z.string().min(3),
  BETTER_AUTH_SECRET_V2: z.string().min(3),
  BETTER_AUTH_URL: z.string().min(3),
  GH_STATS_TOKEN: z.string().min(3),
  CRON_SECRET: z.string().min(3),
  GITHUB_CLIENT_ID: z.string().min(3),
  GITHUB_CLIENT_SECRET: z.string().min(3),
  SHOWCASE_WEBHOOK_SECRET: z.string().min(3),
  BLOG_WEBHOOK_SECRET: z.string().min(3),
  AUTHOR_VALIDATE_SECRET: z.string().min(3),
  BETTER_AUTH_API_KEY: z.string().min(3).optional(),
  // Open Data API rate limiting (Upstash Redis). Optional: when unset, the API fails open
  // (no rate limiting) so local dev and previews work without an Upstash account.
  UPSTASH_REDIS_REST_URL: z.string().min(3),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(3),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsedEnv = serverEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(z.prettifyError(parsedEnv.error));
}

export const serverEnv = parsedEnv.data;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ServerEnv {}
  }
}
