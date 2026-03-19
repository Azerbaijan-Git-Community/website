# Coding Instructions

## Enforced Conventions

Versions can be outdated, always check the latest versions in `package.json` and `AGENTS.md` for docs:

- **TypeScript Only**: All source files must be `.ts` or `.tsx`. No plain JavaScript for app logic.
- **Next.js 16 & React 19**: Use the Next.js app directory and React 19.2 features. Follow Next.js best practices for routing, layouts, and data fetching.
- **Cache Components & React Compiler**: `cacheComponents` and `reactCompiler` are enabled in `next.config.ts`. You **must** read and follow `.agents/skills/next-cache-components/SKILL.md` and React Compiler/Server Components best practices before writing or editing any code. Always apply skill rules for caching, partial prerendering, and compiler boundaries.
- **ESLint & Prettier**: Code must pass ESLint (`next/core-web-vitals`, `next/typescript`, `prettier`) and be formatted with Prettier. Run `pnpm lint` and `pnpm checks` before commits.
- **Tailwind CSS**: Use Tailwind v4 for all styling. Avoid inline styles and external CSS except for global styles in `globals.css`.
- **Path Aliases**: Use `@/` for imports from `src`.
- **Component Structure**: Place components in `src/components` and pages in `src/app`.
- **React Composition Patterns**: Prefer compound components, context providers, and composition over configuration. Avoid boolean prop proliferation. Follow `.agents/skills/vercel-composition-patterns/` and `.agents/skills/vercel-react-best-practices/`.
- **No Boolean Prop Proliferation**: Use explicit variants or composition instead of many boolean props.
- **Strict Type Checking**: All code must pass TypeScript strict mode.
- **HeroUI Components**: Use HeroUI v3 React components as the primary UI library. Use as much HeroUI as possible. **Always consult AGENTS.md for the HeroUI v3 docs index and usage.** Never use v2 patterns. See `.agents/skills/heroui-react/SKILL.md` for best practices.
- **Icons**: Use the `react-icons` library for all icons.

## Required References

- **AGENTS.md**: Always use [AGENTS.md](../../AGENTS.md) for HeroUI v3 documentation index and other agent-driven docs. **Consult AGENTS.md before using any HeroUI component or agent skill.**
- **Skill Files**: Always read and follow:
  - `.agents/skills/vercel-composition-patterns/AGENTS.md`
  - `.agents/skills/vercel-react-best-practices/AGENTS.md`
  - `.agents/skills/next-cache-components/SKILL.md`
  - `.agents/skills/heroui-react/SKILL.md`

## Example Prompts

- Add a new compound component for the landing page, following project composition patterns.
- Refactor this component to avoid boolean props and use explicit variants.
- Format and lint all code before pushing.
- Implement a cached component using the 'use cache' directive and cacheLife, following next-cache-components skill.
- Update a server action to use updateTag or revalidateTag for cache invalidation.

## Additional Customizations

- Add instructions for API integration patterns.
- Enforce accessibility best practices in UI components.
- Document custom hooks and context usage patterns.

---

This file enforces project-wide coding standards. For details, always consult [AGENTS.md](../../AGENTS.md) and the referenced skill files above.
