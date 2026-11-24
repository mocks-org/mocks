import { resolve } from '$app/paths';
import { site } from '#lib/settings/site';
import type { RequestHandler } from './$types';

/**
 * Dynamic so the sitemap URL follows `site.url`. A static `robots.txt` would
 * keep pointing at the upstream domain in every fork.
 */
export const GET: RequestHandler = () => {
	const body = [
		'User-agent: *',
		'Disallow:',
		'',
		`Sitemap: ${new URL(resolve('/sitemap.xml'), site.url).href}`,
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
