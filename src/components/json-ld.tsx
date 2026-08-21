/**
 * Renders a JSON-LD structured-data <script> tag.
 * Accepts one schema object or an array of them.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // oxlint-disable-next-line no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
