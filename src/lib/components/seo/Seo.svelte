<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/settings/site';

	type Props = {
		/** Page title without the site name. Omit to fall back to the site tagline. */
		title?: string;
		/** Defaults to `site.description`. */
		description?: string;
		/** Set to false for transient or private pages that should not be indexed. */
		index?: boolean;
	};

	let { title, description = site.description, index = true }: Props = $props();

	const documentTitle = $derived(
		title ? `${title} · ${site.name}` : `${site.name} — ${site.tagline}`
	);
	/** Canonical paths are emitted only for indexable pages. */
	const canonical = $derived(index ? new URL(page.url.pathname, site.url).href : null);
</script>

<svelte:head>
	<title>{documentTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content={documentTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:locale" content={site.locale} />
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	{#if !index}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>
