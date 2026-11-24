<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars -- the props are the fork's typed contract, this default renders nothing */
	/**
	 * Fork seam: structured data (JSON-LD).
	 *
	 * Rendered by `Seo.svelte` on every page. Empty by design: no deployed sites
	 * needs no structured data, and upstream never edits this file after release.
	 * A fork renders its own `<svelte:head>` block with an
	 * `application/ld+json` script and keeps the values in sync with the meta
	 * tags `Seo.svelte` already emits.
	 *
	 * `documentTitle` is the full title including the site name, `title` is the
	 * page title alone. `canonical` is null on non-indexable pages.
	 */
	let {
		title,
		description,
		canonical,
		index = true,
		documentTitle
	}: {
		title?: string;
		description?: string;
		canonical?: string | null;
		index?: boolean;
		documentTitle?: string;
	} = $props();
</script>
