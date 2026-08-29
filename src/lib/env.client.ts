import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z
    .url()
    .refine((url) => !url.endsWith("/"), { message: "NEXT_PUBLIC_BASE_URL must not have a trailing slash" }),
  NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL: z.url().refine((url) => !url.endsWith("/"), {
    message: "NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL must not have a trailing slash",
  }),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL,
});
