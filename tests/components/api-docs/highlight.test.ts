import { describe, expect, test } from "vitest";
import { highlightJson } from "@/components/api-docs/highlight";

describe("highlightJson", () => {
  test("colors keys, strings, numbers, booleans and null", () => {
    const html = highlightJson('{"a": "x", "n": -1.5e3, "t": true, "f": false, "z": null}');
    expect(html).toBe(
      '{<span class="text-blue">"a":</span> <span class="text-lime">"x"</span>, ' +
        '<span class="text-blue">"n":</span> <span class="text-purple">-1.5e3</span>, ' +
        '<span class="text-blue">"t":</span> <span class="text-icon-orange">true</span>, ' +
        '<span class="text-blue">"f":</span> <span class="text-icon-orange">false</span>, ' +
        '<span class="text-blue">"z":</span> <span class="text-dim">null</span>}',
    );
  });

  test("handles escaped quotes inside strings", () => {
    expect(highlightJson('"say \\"hi\\""')).toBe('<span class="text-lime">"say \\"hi\\""</span>');
  });

  test("escapes HTML so response bodies can't inject markup", () => {
    const html = highlightJson('{"x": "<img src=x onerror=alert(1)>"}');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  test("escapes non-JSON error pages too", () => {
    const html = highlightJson("<h1>502 Bad Gateway & co</h1>");
    expect(html).not.toContain("<h1>");
    expect(html).toContain("Bad Gateway &amp; co&lt;/h");
  });
});
