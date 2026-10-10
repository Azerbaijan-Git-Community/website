import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, test } from "vitest";
import { Toaster } from "@/components/toaster";

describe("Toaster", () => {
  test("shows toasts with their description in the site's dark theme", async () => {
    const { container } = render(<Toaster />);

    act(() => {
      toast.error("Sync failed", { description: "Request failed (500)" });
    });

    expect(await screen.findByText("Sync failed")).toBeInTheDocument();
    expect(screen.getByText("Request failed (500)")).toHaveClass("text-lo!");

    const toaster = container.ownerDocument.querySelector<HTMLElement>("[data-sonner-toaster]")!;
    expect(toaster).toHaveAttribute("data-sonner-theme", "dark");
    expect(toaster.style.getPropertyValue("--normal-bg")).toBe("var(--color-overlay)");
    expect(toaster.style.getPropertyValue("--normal-border")).toBe("var(--color-line)");
  });
});
