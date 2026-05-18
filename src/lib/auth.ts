import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth/minimal";
import { prisma } from "./prisma";
import { dash, sentinel } from "@better-auth/infra";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  appName: "Azerbaijan GitHub Community",
  plugins: [
    admin({ bannedUserMessage: "You are banned from the community because of your Bot activity on GitHub." }),
    sentinel(),
    dash(),
  ],
  experimental: { joins: true },
  advanced: {
    database: {
      generateId: false,
    },
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
  secrets: [
    { version: 2, value: process.env.BETTER_AUTH_SECRET_V2 },
    { version: 1, value: process.env.BETTER_AUTH_SECRET_V1 },
  ],
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
      strategy: "jwe",
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
        githubId: profile.id,
      }),
    },
  },
  user: {
    additionalFields: {
      githubUsername: { type: "string", required: false },
      githubId: { type: "number", required: false },
    },
  },
});
