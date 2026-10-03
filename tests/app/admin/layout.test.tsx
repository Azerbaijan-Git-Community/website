import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import AdminLayout from "@/app/admin/layout";

describe("AdminLayout", () => {
  test("renders its children", () => {
    render(
      <AdminLayout>
        <p>console</p>
      </AdminLayout>,
    );
    expect(screen.getByText("console")).toBeInTheDocument();
  });
});
