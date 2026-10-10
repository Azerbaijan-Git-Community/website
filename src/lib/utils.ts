import * as z from "zod/mini";

export const ResponseSchema = z.object({ message: z.optional(z.string()), error: z.optional(z.string()) });
