import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap';

describe('buildSitemap', () => {
	it('resolves paths against the configured origin', () => {
		const xml = buildSitemap(['/', '/about'], 'https://example.com');

		expect(xml).toContain('<loc>https://example.com/</loc>');
		expect(xml).toContain('<loc>https://example.com/about</loc>');
	});

	it('deduplicates repeated paths', () => {
		const xml = buildSitemap(['/', '/about', '/about'], 'https://example.com');

		expect(xml.match(/<loc>/g)).toHaveLength(2);
	});

	it('escapes XML-sensitive characters', () => {
		const xml = buildSitemap(['/search?q=a&b=1'], 'https://example.com');

		expect(xml).toContain('q=a&amp;b=1');
	});
});
