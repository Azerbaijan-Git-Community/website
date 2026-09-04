/**
 * Renders a JSON-LD structured-data <script> tag.
 * Accepts one schema object or an array of them.
 *
 * JSON is escaped for safe embedding in HTML (`</script>` breakout).
 * `JSON.stringify` alone does not escape `<`, `>`, `&`, U+2028/U+2029,
 * so a value like `"</script><script>alert(1)</script>"` would break out
 * of the element and execute. Escaping to `\u00xx` keeps valid JSON
 * (JSON parses `\u003c` back to `<`) while making it HTML-safe.
 */
export function toSafeJsonLd(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // oxlint-disable-next-line no-danger
      dangerouslySetInnerHTML={{ __html: toSafeJsonLd(data) }}
    />
  );
}
