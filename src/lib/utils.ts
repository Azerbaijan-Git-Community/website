import { z } from "zod";

export const ResponseSchema = z.object({ message: z.string().optional(), error: z.string().optional() });
