const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/**
 * Builds a `sitemap.xml` document from site paths.
 * Paths are resolved against `origin` and deduplicated, so the homepage can be
 * listed both directly and as a nav link without appearing twice. The origin
 * comes from `site.url`. Paths come from `resolve()` so the base path and route
 * groups are handled by SvelteKit.
 */
export function buildSitemap(paths: readonly string[], origin: string): string {
	const base = origin.endsWith('/') ? origin : `${origin}/`;
	const urls = [...new Set(paths.map((path) => new URL(path, base).href))];

	const entries = urls
		.map((url) => `\t<url>\n\t\t<loc>${escapeXml(url)}</loc>\n\t</url>`)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${SITEMAP_NS}">
${entries}
</urlset>
`;
}
