import { env } from 'cloudflare:workers';
import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';
import { buildSitemap } from '#lib/seo/sitemap';
import { site } from '#lib/settings/site';
import { getBankRepository } from '#lib/server/repositories';
import type { RequestHandler } from './$types';

/**
 * `resolve()` is overloaded per route id, so a union of static ids matches no
 * overload. Header and footer links are documented as static routes, the same
 * narrowing `NavLinks.svelte` uses.
 */
const hrefFor = (id: RouteId) => resolve(id as '/(site)');

/**
 * Generated per request because the exam list lives in D1, not in `content/`.
 * Installing a pack and seeding the database adds its exam to the sitemap
 * without a code or file change.
 */
export const GET: RequestHandler = async ({ platform }) => {
	const repository = getBankRepository(platform?.env.DB ?? env.DB);
	const exams = await repository.listExams();

	const paths = [
		resolve('/(site)'),
		...site.headerLinks.map(({ id }) => hrefFor(id)),
		...site.footerLinks.map(({ id }) => hrefFor(id)),
		...exams.flatMap(({ slug }) => [
			resolve('/portal/[exam]', { exam: slug }),
			resolve('/portal/[exam]/start', { exam: slug })
		])
	];

	return new Response(buildSitemap(paths, site.url), {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
