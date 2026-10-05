/**
 * Injects a Schema.org JSON-LD block into the page <head>.
 * Server component: render it inside any page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
