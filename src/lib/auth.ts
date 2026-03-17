import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 15, // 15 days
    cookieCache: {
      enabled: true,
      strategy: "compact",
      maxAge: 30 * 60, // 30 minutes
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["read:user", "user:email"],
      overrideUserInfoOnSignIn: true,
      mapProfileToUser: (profile) => ({
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
        githubUsername: profile.login,
      }),
    },
  },
  user: { additionalFields: { githubUsername: { type: "string", required: false } } },
});
