import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminPage, { metadata } from "@/app/admin/page";
import { sessionHeadersFor } from "@test/auth";
import { createUser } from "@test/db";
import { incomingRequest } from "@test/next-headers";
import { renderServer } from "@test/render-server";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

beforeEach(() => {
  incomingRequest.headers = new Headers();
});

const NOT_FOUND = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };

describe("AdminPage", () => {
  test("pretends not to exist for anonymous visitors", async () => {
    await expect(renderServer(<AdminPage />)).rejects.toMatchObject(NOT_FOUND);
  });

  test("pretends not to exist for non-admin users", async () => {
    const user = await createUser({ role: "user" });
    incomingRequest.headers = await sessionHeadersFor(user.id);

    await expect(renderServer(<AdminPage />)).rejects.toMatchObject(NOT_FOUND);
  });

  test("shows the console with the admin's email and the sync panel", async () => {
    const admin = await createUser({ role: "admin", githubUsername: "boss" });
    incomingRequest.headers = await sessionHeadersFor(admin.id);

    await renderServer(<AdminPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Admin Console");
    expect(screen.getByText("boss@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sync endpoints")).toBeInTheDocument();
  });

  test("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
