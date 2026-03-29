# Contributing to the AGC Website

Thank you for your interest in contributing to the **Azerbaijan GitHub Community** website — a national open-source movement uniting talent and building innovation across Azerbaijan.

This document outlines everything you need to know to contribute effectively, respectfully, and in alignment with our community standards.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [File Format Preferences](#file-format-preferences)
- [AI-Generated Content](#ai-generated-content)
- [Contact](#contact)

---

## Code of Conduct

By participating in this project, you agree to uphold our [Code of Conduct](https://github.com/Azerbaijan-Git-Community/.github/blob/main/CODE_OF_CONDUCT.md).

Please read it before contributing. We are committed to a harassment-free, inclusive environment for everyone — regardless of background, skill level, or identity.

---

## Ways to Contribute

You do not need to be a developer to contribute. Here are some ways you can help:

- **Bug reports** — Found something broken? Open an issue.
- **Feature suggestions** — Have an idea? Start a discussion or open a feature request issue.
- **Code contributions** — Fix a bug, improve a component, or build a new feature.
- **UI/UX improvements** — Better design, accessibility, or responsiveness.
- **Content & copy** — Improve text, fix typos, or suggest clearer wording.
- **Documentation** — Help keep the README and contributing guide up to date.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- A GitHub account

### Fork & Clone

```bash
# 1. Fork the repository via GitHub UI, then clone your fork:
git clone https://github.com/YOUR_USERNAME/website.git
cd website

# 2. Add the upstream remote:
git remote add upstream https://github.com/Azerbaijan-Git-Community/website.git
```

### Install Dependencies & Setup

```bash
pnpm bootstrap
```

This installs all dependencies, sets up additional tooling, and generates the Prisma client.

### Run Locally

```bash
pnpm dev
```

The site will be available at `http://localhost:3000`.

---

## Development Workflow

1. **Sync your fork** before starting any work:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a new branch** for your contribution. Use a descriptive name:

   ```
   git checkout -b fix/navbar-mobile-overflow
   git checkout -b feat/leaderboard-search
   git checkout -b docs/update-readme
   ```

   Branch naming conventions:
   | Prefix | Use case |
   |--------|----------|
   | `feat/` | New feature |
   | `fix/` | Bug fix |
   | `docs/` | Documentation changes |
   | `style/` | Formatting, no logic change |
   | `refactor/` | Code restructuring |
   | `chore/` | Build tasks, dependencies |

3. **Make your changes** with clear, focused commits (see below).

4. **Test your changes** locally and ensure nothing is broken.

5. **Push your branch** and open a Pull Request.

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit message should be structured as:

```
<type>(<scope>): <short description>
```

**Examples:**

```
feat(leaderboard): add search and filter functionality
fix(navbar): resolve mobile menu overflow on small screens
docs(contributing): add branch naming conventions
style(hero): align CTA buttons on tablet viewport
chore(deps): upgrade next to v14.2.0
```

**Rules:**

- Use the **imperative mood** in the description ("add", not "added" or "adds")
- Keep the first line under **72 characters**
- Do not end the subject line with a period
- Optionally add a blank line followed by a longer body for context

---

## Pull Request Process

1. Ensure your branch is up to date with `upstream/main` before opening a PR.
2. Fill in the PR template completely — describe what you changed and why.
3. Reference any related issue (e.g., `Closes #42`).
4. Keep PRs focused — one feature or fix per PR whenever possible.
5. A maintainer will review your PR. Be prepared for feedback or requested changes.
6. Once approved, a maintainer will merge your PR.

> PRs that do not follow the contribution guidelines or violate the Code of Conduct may be closed without merging.

---

## Issue Reporting

Before opening an issue:

- Search [existing issues](https://github.com/Azerbaijan-Git-Community/website/issues) to avoid duplicates.
- Make sure you are on the latest version.

When reporting a **bug**, please include:

- A clear title and description
- Steps to reproduce the problem
- Expected vs. actual behavior
- Browser/OS/device details if relevant
- Screenshots or screen recordings if helpful

When requesting a **feature**, please include:

- A clear description of the problem it solves
- Your proposed solution or idea
- Any relevant examples or references

---

## File Format Preferences

In alignment with our [Code of Conduct §5](https://github.com/Azerbaijan-Git-Community/.github/blob/main/CODE_OF_CONDUCT.md#5-open-standards-and-software-freedom), we prefer open, vendor-neutral formats for community-facing files:

| Format  | Preferred use                       |
| ------- | ----------------------------------- |
| `.md`   | Documentation, guides, notes        |
| `.html` | Web-facing content                  |
| `.csv`  | Tabular/data files                  |
| `.pdf`  | Final, read-only distributions only |

Proprietary formats (`.docx`, `.pptx`, etc.) are acceptable for personal use but contributors are encouraged to provide an open equivalent when sharing within community spaces.

---

## AI-Generated Content

If your contribution includes AI-generated code or content, please:

- **Disclose it** clearly in your PR description.
- **Review and verify** the output for correctness, quality, and security.
- **Ensure license compatibility** — do not submit AI-generated code if its licensing status is unclear or incompatible with MPL-2.0.

---

## Contact

Have a question that is not covered here? Reach out:

- **Email:** [subhanqedirli@protonmail.com](mailto:subhanqedirli@protonmail.com)
- **Telegram Community:** [t.me/github_azerbaijan](https://t.me/github_azerbaijan)
- **GitHub Organization:** [github.com/Azerbaijan-Git-Community](https://github.com/Azerbaijan-Git-Community)

---

_Thank you for helping build Azerbaijan's open-source future. Every push counts._
