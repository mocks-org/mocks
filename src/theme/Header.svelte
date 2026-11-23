<script lang="ts">
	import SkipLink from '#lib/components/layout/site/SkipLink.svelte';
	import HeaderBrand from '#lib/components/layout/site/HeaderBrand.svelte';
	import NavLinks from '#lib/components/layout/site/NavLinks.svelte';
	import { site } from '#lib/settings/site';
</script>

<!--
	FORK-OWNED FILE -- the site header skin.
	Layout, spacing, type scale and which parts appear are yours to change.
	Do not add aria-*, role, tabindex or landmark elements here: those live in
	the #lib components above so accessibility fixes reach every fork.
	Run `pnpm theme:check` after editing.
-->
<SkipLink />
<div
	class="mx-auto flex min-h-11 w-full max-w-8xl flex-wrap items-center justify-between gap-4 px-3 py-1 sm:px-6"
>
	<HeaderBrand />
	<NavLinks links={site.headerLinks} kind="header" class="shrink-0" />
</div>
