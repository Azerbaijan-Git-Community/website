/**
 * Renders a JSON-LD structured-data <script> tag.
 * Accepts one schema object or an array of them.
 * JSON is escaped for safe embedding in HTML (`</script>` breakout)
 */
function toSafeJsonLd(data: object | object[]): string {
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
