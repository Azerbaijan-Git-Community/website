import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CodeBlock } from "@/components/api-docs/code-block";

describe("CodeBlock", () => {
  test("syntax-highlights the code for the given language", () => {
    const { container } = render(<CodeBlock code={'const answer = "42";'} language="javascript" />);

    expect(container.querySelector("code")).toHaveTextContent('const answer = "42";');
    const colorOf = (text: string) =>
      [...container.querySelectorAll<HTMLElement>("code span")].find((s) => s.textContent === text)?.style.color;
    expect(colorOf("const")).toBeTruthy();
    expect(colorOf('"42"')).toBeTruthy();
    expect(colorOf("const")).not.toBe(colorOf('"42"'));
  });

  test("sits on a transparent background", () => {
    const { container } = render(<CodeBlock code="x" language="bash" />);
    expect(container.querySelector("pre")).toHaveStyle({ background: "transparent" });
  });

  test("only constrains the height when asked to", () => {
    const { container, rerender } = render(<CodeBlock code="x" language="bash" />);
    expect(container.querySelector("pre")!.style.maxHeight).toBe("");

    rerender(<CodeBlock code="x" language="bash" maxHeight="20rem" />);
    expect(container.querySelector("pre")!.style.maxHeight).toBe("20rem");
  });
});
