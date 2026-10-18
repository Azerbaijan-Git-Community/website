# STYLE.md

The visual language of the Azerbaijan GitHub Community website. It describes what the code already does, so new UI looks like it belongs. Tokens live in [`src/app/globals.css`](src/app/globals.css); everything else is Tailwind v4 utilities on plain elements (no component library).

## Principles

1. **GitHub dark, not generic dark.** Colors, borders and radii come from GitHub's dark theme (`#0d1117` canvas, `#30363d` lines, 6px corners). The site should feel like a natural extension of github.com.
2. **Glass on canvas.** Content sits on translucent, blurred `glass` panels over a flat dark canvas. Depth comes from blur, a soft shadow and a 10% white border, not from heavy shadows or bright fills.
3. **Color is an accent, not a surface.** Large areas stay neutral. Color appears in small doses: one gradient word per heading, green for the primary action and commit counts, blue for links and focus.
4. **Developer flavor.** Terminal window chrome, `$ git ...` error lines, monospace numbers and `#hashtag` chips signal "made by and for developers". Use them where they add character, not everywhere.
5. **Quiet motion.** Things fade/slide in once on scroll and lift slightly on hover. Nothing loops except decorative hero blobs and loading spinners, and everything respects `prefers-reduced-motion`.
6. **Plain elements, accessible by default.** Native `<button>`/`<a>`, real ARIA roles for custom widgets, visible `focus-visible` rings.

## Tokens

### Color

Defined in `@theme`, so each is a Tailwind utility (`bg-*`, `text-*`, `border-*`, `ring-*`, …).

| Token                                | Value                                             | Use                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `canvas`                             | `#0d1117`                                         | Page background (`body`), footer, drawer, inputs                                                                                     |
| `surface`                            | `#161b22`                                         | Solid sections (alternating landing bands), small buttons, active tab/nav item, menus                                                |
| `overlay`                            | `#21262d`                                         | Hover fill for neutral buttons, code/terminal bodies, progress track, inline code                                                    |
| `hi`                                 | `#f0f6fc`                                         | Primary text, headings                                                                                                               |
| `lo`                                 | `#8b949e`                                         | Secondary text, body copy under headings, inactive tabs, table numbers                                                               |
| `dim`                                | `#848d97`                                         | Tertiary text: meta (dates, authors), captions, sidebar group labels, footer legal                                                   |
| `line`                               | `#30363d`                                         | Every border and divider. Also the **default border color** (set in the base layer), so a bare `border` is already `line`            |
| `green`                              | `#2ea043`                                         | Primary CTA fill, active segmented tab                                                                                               |
| `lime`                               | `#3fb950`                                         | Primary CTA hover, commit counts, success, "live" dots, link hover on blue links                                                     |
| `blue`                               | `#58a6ff`                                         | Links, icons, focus rings, active nav, HTTP method badges                                                                            |
| `purple`                             | `#8957e5`                                         | Brand accent, end stop of the brand gradient                                                                                         |
| `danger`                             | `#f85149`                                         | Destructive actions (sign out), error states                                                                                         |
| `icon-blue/purple/green/orange/pink` | `#58a6ff` `#8957e5` `#3fb950` `#d29922` `#f778ba` | Category icons (impact cards, showcase stats). `icon-orange` doubles as warning, `icon-pink` as the "fatal:" color in terminal lines |

**Brand gradient:** `linear-gradient(135deg, blue, purple)`. As text use `.text-gradient`; as a fill use `bg-linear-to-r from-blue to-purple`. Success gradient: `bg-linear-135 from-green to-lime` (progress bar).

**Recurring translucent values** (not tokens yet; reuse these exact values rather than inventing new ones):

| Value                                                     | Meaning                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `bg-[rgba(48,54,61,0.5)]`                                 | "Line at 50%": pill badges, table headers, terminal title bars                  |
| `hover:bg-[rgba(48,54,61,0.3)]`                           | Table row hover                                                                 |
| `bg-[rgba(13,17,23,0.5)]` / `0.6`                         | Inset on glass: stat boxes, terminal error blocks, admin panels                 |
| `rgba(<accent>,0.1)` bg + `rgba(<accent>,0.2–0.3)` border | Tinted chip/badge for an accent color (e.g. `#tags`, method badges, icon tiles) |
| `bg-danger/10`                                            | Destructive item hover                                                          |

**Fixed decorative colors:** medal gold `#FFD700→#FFA500`, silver `#C0C0C0→#A8A8A8`, bronze `#CD7F32→#B87333`; window-chrome dots `#ff5f56` `#ffbd2e` `#27c93f`. Only for those uses.

### Typography

| Family      | Utility       | Use                                                                                      |
| ----------- | ------------- | ---------------------------------------------------------------------------------------- |
| Outfit      | `font-outfit` | All headings, display numbers, nav links, buttons, table headers, card titles, usernames |
| System sans | (default)     | Body copy, descriptions, meta text                                                       |
| Monospace   | `font-mono`   | Numbers in tables/stat boxes, code, endpoint paths, admin console                        |

Inter is loaded (`--font-inter`) but only used for the code-block title and OG images; body text uses the system stack. Native buttons don't inherit Outfit, so **add `font-outfit` to every button**.

| Role             | Classes                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Hero H1          | `font-outfit text-[clamp(3rem,5vw,4.5rem)] leading-[1.2] font-bold tracking-tight`                     |
| Page H1          | `font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold`                                    |
| Section H2       | `font-outfit text-[2.5rem] font-bold`                                                                  |
| Doc H2           | `font-outfit text-3xl font-bold`                                                                       |
| Card title       | `font-outfit text-xl font-bold`                                                                        |
| Lead paragraph   | `text-xl text-lo` (`text-lg` on listing pages), `max-w-xl`/`max-w-2xl mx-auto`                         |
| Body / card text | `text-sm text-lo` (`leading-relaxed` for multi-line)                                                   |
| Eyebrow / label  | `text-xs tracking-wider uppercase text-lo` (`tracking-widest` for hero labels, `text-dim` in sidebars) |
| Big number       | `font-outfit text-3xl–5xl font-extrabold leading-none`                                                 |
| Stat number      | `font-mono text-xl–3xl font-bold text-lime`                                                            |

One word per heading may get `.text-gradient` ("Push the future of **Azerbaijan**", "Monthly **Leaderboard**").

### Spacing and layout

- **Container:** `mx-auto max-w-300 px-8` (1200px). Articles `max-w-200`, admin `max-w-4xl px-6`.
- **Page top:** `pt-32 pb-24` (clears the fixed 80px navbar). Hero `pt-44 pb-32`.
- **Landing sections:** `py-24`; closing CTA `py-32`. Bands alternate between canvas and `bg-surface border-y border-line`.
- **Section header:** `mb-12`–`mb-16`, centered.
- **Grids:** cards `gap-6` (`gap-8` for 3 large cards), KPI tiles `gap-4`; columns `1 → sm:2 → lg:3`.
- **Card padding:** `p-8` large, `p-6` medium, `p-5` compact/listing cards.
- Use the Tailwind spacing scale; arbitrary values only for clamps and widths that have no utility.

### Radius

GitHub-style, based on 6px. The scale is redefined in `@theme`, so it differs from Tailwind's defaults:

| Utility        | Value | Use                                                                           |
| -------------- | ----- | ----------------------------------------------------------------------------- |
| `rounded-md`   | 4.5px | Buttons, inputs, tabs, nav items, inline code, badges                         |
| `rounded-lg`   | 6px   | Segmented control, stepper, insets/stat boxes, menus, toasts, images in prose |
| `rounded-xl`   | 9px   | Cards, panels, terminals, hero visual                                         |
| `rounded-full` | —     | Avatars, pill badges, chips, dots, rank badges, progress bars                 |

### Elevation

- **Card shadow:** `shadow-[0_8px_32px_rgba(0,0,0,0.2)]`. **Floating** (menus, toasts): `rgba(0,0,0,0.3)`.
- **Glows** only for highlights: primary CTA hover `shadow-[0_0_15px_rgba(46,160,67,0.4)]`, active tab, roadmap goal dot, medals.
- **Z-order:** navbar `fixed z-50`; drawer `z-50`; menus are positioned inside the navbar.

### Motion

- **Easing:** `[0.22, 1, 0.36, 1]` (ease-out-quint) for all entrances; CSS equivalent `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Scroll reveal** (motion): `initial {opacity:0, y:20}` → `whileInView {opacity:1, y:0}`, `viewport {once:true, amount:0.3}`, `duration 0.5–0.7`, stagger `i * 0.07–0.1`. Side-by-side columns slide from `x: ±30`.
- **Hover lift:** buttons `hover:-translate-y-0.5`; cards `whileHover {y:-5}` or `hover:-translate-y-1.5`.
- **Micro:** color transitions use `transition-colors`; small UI (stepper label, menu) animates in 150–200ms.
- **Loading:** `animate-spin` on `PiArrowsClockwise`/`PiCircleNotch`; skeletons `animate-pulse bg-surface`.
- Respect reduced motion: CSS keyframes are disabled under `prefers-reduced-motion`; prefer `motion` components (which honor it) over custom keyframes.

## Surfaces

| Surface             | Recipe                                                                                                                                                                            | Use                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Glass panel**     | `glass rounded-xl` + card shadow                                                                                                                                                  | Default container for cards, tables, terminals, stat panels              |
| **Highlight glass** | Glass + `relative overflow-hidden border-[rgba(137,87,229,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple` | The one standout item in a set (GII stat, roadmap goal, podium champion) |
| **Solid band**      | `bg-surface border-y border-line`                                                                                                                                                 | Alternating landing sections                                             |
| **Inset**           | `rounded-lg border border-line bg-[rgba(13,17,23,0.5)]`                                                                                                                           | Stat boxes inside glass                                                  |
| **Header bar**      | `border-b border-line bg-[rgba(48,54,61,0.5)] px-4 py-3`                                                                                                                          | Top of terminals, tables, result panels                                  |
| **Window chrome**   | Three `size-3 rounded-full` dots (`#ff5f56`, `#ffbd2e`, `#27c93f`) in a header bar                                                                                                | Terminal/code mockups, error pages                                       |
| **Hero backdrop**   | `.blob .blob-purple/.blob-green` + `.grid-overlay`                                                                                                                                | Hero only                                                                |

## Components

### Buttons

Always native `<button type="button">` or a link styled as one. Every button gets `cursor-pointer`, `font-outfit`, `font-semibold` and `focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none`.

| Variant         | Classes                                                                                                           | Use                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Primary         | `rounded-md bg-green text-black hover:bg-lime hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(46,160,67,0.4)]` | The main CTA of a section (one per group)     |
| Secondary       | `rounded-md border border-line text-hi hover:border-lo hover:bg-overlay hover:-translate-y-0.5`                   | Alternatives next to a primary                |
| Gradient        | `rounded-md bg-linear-to-r from-blue to-purple text-white hover:opacity-90 hover:-translate-y-0.5`                | Primary action on error pages                 |
| Surface (small) | `rounded-md border border-line bg-surface text-hi hover:border-lo hover:bg-overlay`                               | Navbar sign-in, admin "Run", compact actions  |
| Ghost / icon    | `rounded-md text-lo hover:bg-overlay hover:text-hi`                                                               | Copy buttons, stepper arrows, toolbar actions |

Sizes: large `px-8 py-4 text-lg` (landing CTAs), medium `h-11 px-6 text-sm` (error pages), small `h-9`–`h-10 px-4 text-xs`–`text-sm`. Animate only `transform`, `background-color`, `border-color`, `box-shadow`, `opacity` (list them in `transition-[...]`).

**Disabled:** `disabled:cursor-not-allowed disabled:opacity-60` (`opacity-30` for icon arrows), and remove the hover effect. **Loading:** keep the width, swap the icon for a spinning one and the label for "Running…".

### Pill badge (eyebrow)

`inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo`, placed above a page or section heading ("Community Rankings", "Strategic Plan").

### Chips and status badges

- Accent chip: `rounded-full border border-[rgba(88,166,255,0.2)] bg-[rgba(88,166,255,0.1)] px-3 py-1 text-sm text-blue`.
- Method/status badge: `rounded-md px-2 py-0.5 font-mono text-xs font-bold` with a tinted background (`rgba(63,185,80,0.15)` + `text-lime` for OK, `rgba(248,81,73,0.15)` + `text-danger` for errors).
- Icon tile: `size-12 rounded-xl` with `bg-[rgba(<color>,0.1)]` and `text-icon-<color>`.

### Cards

Glass panel, `p-5`–`p-8`. Content order: icon or image → title (`font-outfit text-xl font-bold`) → body (`text-sm text-lo`) → optional footer row `mt-auto border-t border-line pt-3` with `text-xs text-dim` meta. Listing cards (blog, showcase) have a `h-44` image header and `line-clamp-2` text.

### Segmented control (period tabs)

Container `glass inline-flex gap-1 rounded-lg p-1`; tab `rounded-md px-6 py-2 font-outfit font-semibold`. Active `bg-green text-white shadow-[0_0_15px_rgba(46,160,67,0.4)]`, inactive `text-lo hover:text-hi`. Small inline tabs (code terminal): active `bg-surface text-hi`.

### Stepper (month selector)

`<fieldset aria-label>` with `glass flex w-fit gap-1 rounded-lg p-1`. Two `size-9` ghost icon buttons around a fixed-width label (`w-36 text-base font-medium text-lo`) so the arrows never shift. Disable the arrow at each end; ←/→ keys step; the label slides in from the direction of travel.

### Menu / popover

Trigger: native button with `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`. Panel: `role="menu"`, `absolute top-full mt-2 rounded-lg border border-line bg-surface p-1` + floating shadow, `animate-in fade-in-0 zoom-in-95 duration-150`. Items: `role="menuitem"`, `rounded-md px-3 py-2 text-sm font-medium text-lo`. Close on outside click, Escape (return focus to the trigger) and tabbing away; focus the first item on open. Destructive items stay muted and turn `text-danger bg-danger/10` only on hover/focus.

### Navigation

- Navbar: `fixed h-20 border-b border-line bg-[rgba(13,17,23,0.8)] backdrop-blur-md`; links `font-outfit font-medium text-hi hover:text-blue`.
- Sidebar/drawer items: `rounded-md px-3 py-1.5 text-sm`; active `bg-surface font-medium text-blue`, inactive `text-lo hover:text-hi`.
- Text links: `text-blue hover:text-lime` in copy; `text-lo hover:text-blue` in footers/meta; `text-lo hover:text-hi` for icon links.

### Tables

Inside a glass panel. Header row `border-b border-line bg-[rgba(48,54,61,0.5)]`, header cells `px-6 py-4 font-outfit text-sm font-semibold tracking-wider text-lo uppercase`. Rows `border-b border-line last:border-0 hover:bg-[rgba(48,54,61,0.3)]`. Numbers centered in `font-mono text-lg`; the key metric `font-bold text-lime`, the rest `text-lo`. Below `lg`, switch to stacked glass cards with a 2×2 grid of insets.

### Avatars and ranks

Avatars are `rounded-full ring-2 ring-line`, requested at 2× via `sizedGithubAvatar(url, px * 2)`. Ranks 1–3 use the medal gradients with a matching glow; others `bg-surface text-lo border border-line`.

### Forms

Input: `rounded-md border border-line bg-canvas px-3 py-2 font-mono text-sm text-hi outline-none focus:border-blue`. Label: `text-sm font-medium text-hi` with the hint in `font-normal text-lo`.

### Code

- Inline: `rounded-md border border-line bg-overlay px-1.5 py-0.5 font-mono text-sm text-hi`.
- Terminal: glass panel + window-chrome header bar + optional tab row + `bg-overlay` body. Copy button top-right, `PiCheck text-lime` after copying.
- Blog code blocks are styled in `globals.css` (`rehype-pretty-code`): surface background, line border, highlighted lines with a blue left border.

### Feedback

- **Toasts:** Sonner, bottom-right, themed with tokens in `toaster.tsx` (overlay background, line border, `radius-lg`). Icons: success `lime`, error `danger`, warning `icon-orange`, info `blue`.
- **Empty states:** a centered glass panel (or plain block) with `font-outfit text-lg text-lo` and a `text-sm text-dim` hint or `text-blue` call-to-action link.
- **Skeletons:** same size and shape as what loads (`size-14 rounded-full` for the avatar), `animate-pulse bg-surface`. Keep the slot a fixed size so nothing shifts when content arrives.
- **Error pages (404/401):** huge gradient status code, a terminal block with a git-flavored message (`$` in lime, `fatal:` in `icon-pink`), H2 + `text-lo` explanation, then gradient primary + surface secondary buttons.

## Page patterns

**Page header** (blog, showcase, leaderboard, API docs):

```tsx
<div className="mb-12 text-center">
  <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
    Community Rankings
  </span>
  <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
    Monthly <span className="text-gradient">Leaderboard</span>
  </h1>
  <p className="mx-auto max-w-2xl text-xl text-lo">
    Top 50 contributors pushing Azerbaijan's open-source future forward.
  </p>
</div>
```

**Landing section:** `section py-24` → container → centered header (`mb-16`) → grid of glass cards with staggered scroll reveal.

**Icons:** `react-icons`, mostly Phosphor (`Pi*`). Use the `Bold` weight inside buttons and small UI, the regular weight for large decorative icons. Size with `size-4` (buttons), `text-2xl` (tiles), `text-[2.5rem]` (feature cards).

## Accessibility

- Text on canvas/surface uses `hi` or `lo`; don't put `dim` on anything essential.
- Every interactive element is a native `<button>` or `<a>`; icon-only buttons get an `aria-label`.
- Custom widgets get the correct roles and states (`menu`/`menuitem`, `aria-expanded`, `aria-live` for changing labels, `fieldset` for grouped controls).
- Visible keyboard focus: `focus-visible:ring-2 focus-visible:ring-blue` (or `focus:border-blue` on inputs).
- Decorative elements (blobs, medal badges, window dots) are `aria-hidden` or purely presentational.
- External links: `target="_blank" rel="noopener noreferrer"`.

## Do's and don'ts

| ✅ Do                                               | ❌ Don't                                                 |
| --------------------------------------------------- | -------------------------------------------------------- |
| Use tokens (`text-lo`, `border-line`, `bg-surface`) | Hardcode hex values that already have a token            |
| Put content on `glass` panels                       | Use bright or opaque colored backgrounds for large areas |
| Use one gradient word per heading                   | Gradient whole headings or body text                     |
| Keep one primary (green) action per group           | Put two green buttons side by side                       |
| Add `font-outfit` and a focus ring to buttons       | Rely on browser default button fonts or outlines         |
| Reuse the recurring rgba values above               | Invent a new near-identical translucency                 |
| Give loading placeholders the final size            | Let content jump when it streams in                      |
| Use plain elements + Tailwind                       | Add a UI component library back                          |

## Known inconsistencies

Worth fixing when touching these areas:

1. `#f85149` is still hardcoded in [`toaster.tsx`](src/components/toaster.tsx) and [`endpoint-card.tsx`](src/components/api-docs/endpoint-card.tsx); use `text-danger`. The admin sync panel shows errors in `icon-pink` instead of `danger`.
2. The recurring translucent values (`rgba(48,54,61,0.5)`, `rgba(13,17,23,0.5)`, the card shadow) are repeated ~30 times; they could become tokens or helper classes.
3. Landing CTAs (`hero-section`, `join-section`) don't set `font-outfit`, unlike the other buttons.
4. Prose and code-block styles in `globals.css` use raw `4px`/`8px` radii instead of the radius tokens.
5. Inter is loaded on every page but almost unused; either apply it to `body` or drop it from `fonts.ts`.
6. Mixed `h-12 w-12` and `size-12`; prefer `size-*`.
