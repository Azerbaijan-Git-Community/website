import z from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().min(3),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
});
