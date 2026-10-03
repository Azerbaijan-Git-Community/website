import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { JsonLd } from "@/components/json-ld";

function scriptOf(data: object | object[]) {
  const { container } = render(<JsonLd data={data} />);
  return container.querySelector('script[type="application/ld+json"]')!;
}

describe("JsonLd", () => {
  test("embeds the schema as JSON", () => {
    const data = { "@type": "Organization", name: "Azerbaijan GitHub Community" };
    expect(JSON.parse(scriptOf(data).innerHTML)).toEqual(data);
  });

  test("accepts several schemas at once", () => {
    const data = [{ "@type": "Organization" }, { "@type": "WebSite" }];
    expect(JSON.parse(scriptOf(data).innerHTML)).toEqual(data);
  });

  test("escapes characters that could break out of the script tag", () => {
    const data = { name: "</script><script>alert(1)</script> & \u2028\u2029" };
    const html = scriptOf(data).innerHTML;

    expect(html).not.toMatch(/[<>&\u2028\u2029]/);
    expect(html).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(html)).toEqual(data);
  });
});
