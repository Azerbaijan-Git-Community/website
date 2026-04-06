import z from "zod";
import { clientEnvSchema } from "./env.client";

const serverEnvSchema = z.object({
  ...clientEnvSchema.shape,
  DATABASE_URL: z.string().min(3),
  DIRECT_URL: z.string().min(3),
  BETTER_AUTH_SECRET: z.string().min(3),
  BETTER_AUTH_URL: z.string().min(3),
  GH_STATS_TOKEN: z.string().min(3),
  CRON_SECRET: z.string().min(3),
  GITHUB_CLIENT_ID: z.string().min(3),
  GITHUB_CLIENT_SECRET: z.string().min(3),
  SHOWCASE_WEBHOOK_SECRET: z.string().min(3),
  BLOG_WEBHOOK_SECRET: z.string().min(3),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv = serverEnvSchema.parse(process.env);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends ServerEnv {}
  }
}
