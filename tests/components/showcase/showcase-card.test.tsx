import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import type { ShowcaseProject } from "@/data/showcase/get";

function project(overrides: Partial<ShowcaseProject> = {}): ShowcaseProject {
  return {
    id: "p1",
    repo: "acme/rocket",
    submittedBy: "octocat",
    banner: null,
    links: [],
    website: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    stars: 0,
    forks: 0,
    openIssues: 0,
    openPRs: 0,
    description: null,
    homepageUrl: null,
    license: null,
    language: null,
    languageColor: null,
    ...overrides,
  };
}

/** The original URL behind an (optionally next/image-optimized) <img>. */
function imageUrl(img: HTMLElement) {
  const src = new URL(img.getAttribute("src")!, window.location.href);
  return src.pathname === "/_next/image" ? src.searchParams.get("url") : src.href;
}

describe("ShowcaseCard", () => {
  test("shows the owner and repository name", () => {
    render(<ShowcaseCard project={project()} index={0} />);
    expect(screen.getByText("acme /")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "rocket" })).toBeInTheDocument();
  });

  test("uses the banner, or GitHub's OG card when there is none", () => {
    const { unmount } = render(<ShowcaseCard project={project({ banner: "https://i.imgur.com/b.png" })} index={0} />);
    expect(imageUrl(screen.getByRole("img", { name: "acme/rocket banner" }))).toBe("https://i.imgur.com/b.png");
    unmount();

    render(<ShowcaseCard project={project()} index={0} />);
    expect(imageUrl(screen.getByRole("img", { name: "acme/rocket banner" }))).toBe(
      "https://opengraph.githubassets.com/1/acme/rocket",
    );
  });

  test("loads the first three banners eagerly and the rest lazily", () => {
    render(<ShowcaseCard project={project({ repo: "a/top" })} index={2} />);
    render(<ShowcaseCard project={project({ repo: "a/below" })} index={3} />);
    expect(screen.getByRole("img", { name: "a/top banner" })).not.toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("img", { name: "a/below banner" })).toHaveAttribute("loading", "lazy");
  });

  test.for([
    [0, "0"],
    [999, "999"],
    [1000, "1k"],
    [1050, "1.1k"],
    [12_345, "12.3k"],
    [999_499, "999.5k"],
    [1_500_000, "1.5M"],
    [12_340_000, "12.3M"],
  ] as const)("formats %d stars as %s", ([stars, label]) => {
    render(<ShowcaseCard project={project({ stars, openIssues: 3, openPRs: 4 })} index={0} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test("shows open issues and pull requests", () => {
    render(<ShowcaseCard project={project({ stars: 1, openIssues: 7, openPRs: 2500 })} index={0} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2.5k")).toBeInTheDocument();
  });

  test("shows the language with its color and the license when known", () => {
    render(<ShowcaseCard project={project({ language: "Go", languageColor: "#00ADD8", license: "MIT" })} index={0} />);
    expect(screen.getByText("Go").firstElementChild).toHaveStyle({ backgroundColor: "#00ADD8" });
    expect(screen.getByText("MIT")).toBeInTheDocument();
  });

  test("omits language and license when unknown", () => {
    render(<ShowcaseCard project={project()} index={0} />);
    expect(screen.queryByText("MIT")).not.toBeInTheDocument();
    expect(document.querySelector(".rounded-full.size-3")).toBeNull();
  });

  test("links to GitHub, package registries and the website", () => {
    render(
      <ShowcaseCard
        project={project({
          links: ["https://www.npmjs.com/package/rocket", "https://example.com/docs"],
          website: "https://rocket.dev",
        })}
        index={0}
      />,
    );

    expect(screen.getByRole("link", { name: "View on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/acme/rocket",
    );
    expect(screen.getByRole("link", { name: "npm" })).toHaveAttribute("href", "https://www.npmjs.com/package/rocket");
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "https://example.com/docs");
    expect(screen.getByRole("link", { name: "Visit website" })).toHaveAttribute("href", "https://rocket.dev");
    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("BUG-12: rounds large counts into millions instead of showing 1000k", () => {
    render(<ShowcaseCard project={project({ stars: 999_999 })} index={0} />);
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.queryByText("1000k")).not.toBeInTheDocument();
  });
});
