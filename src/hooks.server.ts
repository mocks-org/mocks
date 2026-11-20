import type { Handle } from '@sveltejs/kit/hooks';
import { site } from '#lib/settings/site';

/**
 * `app.html` is a static template and cannot import TypeScript modules, so the
 * document language is filled in here. Titles and descriptions are rendered by
 * `Seo.svelte` instead: a static `<title>` in `app.html` would compete with the
 * per-page one, and the browser always uses the first title in the document.
 */
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replaceAll('%mocks.lang%', site.locale)
	});
};
