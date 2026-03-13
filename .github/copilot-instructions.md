# Project Coding Instructions

## Enforced Conventions

**TypeScript Only**: All source files must use TypeScript (.ts, .tsx). No plain JavaScript files for app logic.
**Next.js 16 & React 19**: Use Next.js app directory structure and React 19.2 features. Follow Next.js best practices for routing, layouts, and data fetching.
**Cache Components & React Compiler**: Both `cacheComponents` and `reactCompiler` are enabled in `next.config.ts`. You must read and follow the `.agents/skills/next-cache-components/SKILL.md` and React Compiler/Server Components best practices before writing or editing any code. Always apply relevant skill rules for caching, partial prerendering, and compiler boundaries.
**ESLint & Prettier**: Code must pass ESLint (with next/core-web-vitals, next/typescript, prettier) and be formatted with Prettier. Use `pnpm lint` and `pnpm format:check` before commits.
**Tailwind CSS**: Use Tailwind v4 for all styling. Avoid inline styles and external CSS except for global styles in `globals.css`.
**Path Aliases**: Use `@/` alias for imports from `src`.
**Component Structure**: Organize components in `src/components` and pages in `src/app`.
**React Composition Patterns**: Prefer compound components, context providers, and composition over configuration. Avoid boolean prop proliferation. Follow patterns from `.agents/skills/vercel-composition-patterns` and `.agents/skills/vercel-react-best-practices`.
**No Boolean Prop Proliferation**: Use explicit variants or composition instead of many boolean props.
**Strict Type Checking**: All code must pass TypeScript strict mode.
**HeroUI Components**: Use HeroUI v3 React components as the primary UI library. Always when you want to have a component search for HeroUI docs if they have a builtin component for that. Always follow the latest HeroUI v3 docs (see AGENTS.md for docs index and usage). Do not use v2 patterns. See `.agents/skills/heroui-react/SKILL.md` for best practices.
**Icons**: Use the `react-icons` library for all icons.

## Example Prompts

"Add a new compound component for the landing page, following project composition patterns."
"Refactor this component to avoid boolean props and use explicit variants."
"Format and lint all code before pushing."
"Implement a cached component using the 'use cache' directive and cacheLife, following next-cache-components skill."
"Update a server action to use updateTag or revalidateTag for cache invalidation."

## Related Customizations to Consider

- Add instructions for API integration patterns.
- Enforce accessibility best practices in UI components.
- Document custom hooks and context usage patterns.

---

This file enforces project-wide coding standards. For details, see:

- `.agents/skills/vercel-composition-patterns/AGENTS.md`
- `.agents/skills/vercel-react-best-practices/AGENTS.md`
- `.agents/skills/next-cache-components/SKILL.md`
- `.agents/skills/heroui-react/SKILL.md`
- `AGENTS.md` (HeroUI v3 docs index)
