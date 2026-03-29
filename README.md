<img src="https://github.com/Azerbaijan-Git-Community/.github/blob/main/profile/agc-logo.png" align="left" width="200"/>

### `Azerbaijan Github Community`

Uniting talent, expanding open-source, and building national innovation metrics.

<a href="https://azerbaijangithubcommunity.vercel.app/">Website</a> ·
<a href="https://www.linkedin.com/company/github-azerbaijan/">Linkedin</a> ·
<a href="https://t.me/github_azerbaijan">Telegram</a> ·
<a href="https://www.instagram.com/azerbaijan_github_community/">Instagram</a>

<br clear="left"/>

---

## About

Azerbaijan GitHub Community is a national open-source growth program with an ambitious goal: **5,000,000 GitHub pushes**. The website serves as the public face of the community — showcasing impact metrics, contributor leaderboards, and the roadmap for Azerbaijan's open-source future.

Members sign in with their GitHub accounts, and their contribution stats (commits, pull requests) are automatically synced and displayed on a competitive leaderboard with weekly, monthly, and all-time rankings.

## Tech Stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org/) (App Router, React 19)   |
| Language       | TypeScript                                                 |
| Styling        | [Tailwind CSS 4](https://tailwindcss.com/)                 |
| UI Components  | [HeroUI v3](https://heroui.com/)                           |
| Animation      | [Motion](https://motion.dev/) (Framer Motion)              |
| Database       | PostgreSQL via [Prisma ORM](https://www.prisma.io/)        |
| Authentication | [Better Auth](https://www.better-auth.com/) (GitHub OAuth) |
| Deployment     | [Vercel](https://vercel.com/)                              |

## Key Features

- **Contributor Leaderboard** — Weekly, monthly, and all-time rankings with podium highlights for top contributors.
- **GitHub Stats Sync** — Automated hourly sync via GitHub Actions keeps contribution data fresh.
- **Server-Side Caching** — Leverages Next.js Cache Components for fast page loads with zero client-side data fetching on navigation.
- **GitHub OAuth** — One-click sign-in to join the community and appear on the leaderboard.
- **Community Roadmap** — Public roadmap showing past milestones and upcoming goals.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── leaderboard/      # Leaderboard page
│   └── api/              # Auth and cron sync endpoints
├── components/           # React components
│   ├── landing/          # Homepage sections
│   └── leaderboard/      # Podium, table, tabs, month selector
├── data/                 # Server-side data fetching functions
└── lib/                  # Shared utilities (Prisma, auth, fonts)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

This project is open source under the [MPL-2.0 license](./LICENSE).
