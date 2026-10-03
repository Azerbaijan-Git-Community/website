import { http, HttpResponse } from "msw";
import { server } from "./msw";

const API = "https://api.github.com";
const ORG = "Azerbaijan-Git-Community";

type Entry = { name: string; sha: string; type: "dir" | "file" };

function entry(name: string, sha: string, type: Entry["type"]) {
  return { name, sha, type, download_url: type === "file" ? `https://raw.githubusercontent.com/x/${name}` : null };
}

export type FakePost = {
  sha: string;
  mdx: string;
  /** File names inside `posts/<slug>/images`; `null` makes the folder 404. */
  images?: string[] | null;
};

/** Serve the blog repo's contents API from an in-memory map of posts. Returns per-path request counters. */
export function fakeBlogRepo(posts: Record<string, FakePost>, extraRootEntries: Entry[] = []) {
  const requests: string[] = [];
  const base = `${API}/repos/${ORG}/blog/contents/posts`;

  server.use(
    http.get(base, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json([
        ...Object.entries(posts).map(([slug, p]) => entry(slug, p.sha, "dir")),
        ...extraRootEntries.map((e) => entry(e.name, e.sha, e.type)),
      ]);
    }),
    http.get(`${base}/:slug/index.mdx`, ({ params, request }) => {
      requests.push(new URL(request.url).pathname);
      const post = posts[String(params.slug)];
      return post ? HttpResponse.text(post.mdx) : new HttpResponse("Not Found", { status: 404 });
    }),
    http.get(`${base}/:slug/images`, ({ params, request }) => {
      requests.push(new URL(request.url).pathname);
      const post = posts[String(params.slug)];
      const images = post?.images === undefined ? ["cover.png"] : post.images;
      if (images === null) return new HttpResponse("Not Found", { status: 404 });
      return HttpResponse.json(images.map((name) => entry(name, `img-sha-${name}`, "file")));
    }),
  );

  return { requests };
}

export type FakeRegistryFile = { name: string; sha: string; content: string };

/** Serve the showcase registry (`projects/*.yaml`) via the contents + blobs APIs. */
export function fakeShowcaseRegistry(files: FakeRegistryFile[]) {
  server.use(
    http.get(`${API}/repos/${ORG}/showcase/contents/projects`, () =>
      HttpResponse.json(files.map((f) => entry(f.name, f.sha, "file"))),
    ),
    http.get(`${API}/repos/${ORG}/showcase/git/blobs/:sha`, ({ params }) => {
      const file = files.find((f) => f.sha === params.sha);
      return file ? HttpResponse.text(file.content) : new HttpResponse("Not Found", { status: 404 });
    }),
  );
}

type GraphQLAlias = { alias: string; args: Record<string, string> };

/** Pull `alias: field(arg: "value", ...)` selections out of a batched query string. */
function parseAliases(query: string, field: string): GraphQLAlias[] {
  const pattern = new RegExp(`(\\w+): ${field}\\(([^)]*)\\)`, "g");
  return [...query.matchAll(pattern)].map(([, alias, rawArgs]) => ({
    alias,
    args: Object.fromEntries([...rawArgs.matchAll(/(\w+): "([^"]*)"/g)].map(([, k, v]) => [k, v])),
  }));
}

export type GraphQLReply = HttpResponse<string> | HttpResponse<null> | undefined;

/**
 * Answer batched GraphQL queries alias-by-alias, the way GitHub does: unknown aliases come back `null`
 * with a matching entry in `errors`. `intercept` can short-circuit a request (e.g. to simulate a 403).
 */
export function fakeGraphQL(options: {
  field: "user" | "repository";
  resolve: (args: Record<string, string>) => unknown;
  intercept?: (requestIndex: number) => GraphQLReply;
}) {
  const queries: string[] = [];

  server.use(
    http.post<never, { query: string }>(`${API}/graphql`, async ({ request }) => {
      const { query } = await request.json();
      queries.push(query);
      const intercepted = options.intercept?.(queries.length - 1);
      if (intercepted) return intercepted;

      const data: Record<string, unknown> = {};
      const errors: { path: string[]; message: string }[] = [];
      for (const { alias, args } of parseAliases(query, options.field)) {
        const value = options.resolve(args) ?? null;
        data[alias] = value;
        if (value === null) errors.push({ path: [alias], message: `Could not resolve ${JSON.stringify(args)}` });
      }
      return HttpResponse.json(errors.length > 0 ? { data, errors } : { data });
    }),
  );

  return { queries, aliasesIn: (query: string) => parseAliases(query, options.field) };
}
