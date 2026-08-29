import { sentinelClient } from "@better-auth/infra/client";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "./env.client";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    sentinelClient({
      identifyUrl: clientEnv.NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL,
    }),
  ],
});
