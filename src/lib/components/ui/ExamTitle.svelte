<script lang="ts">
	import { site } from '#lib/settings/site';
	import { spokenTitle } from '#lib/utils/spoken-title';

	type Props = {
		title: string;
	};

	let { title }: Props = $props();

	const spoken = $derived(spokenTitle(title, site.pronunciations));
</script>

{#if spoken === title}
	{title}
{:else}
	<span class="sr-only">{spoken}</span><span aria-hidden="true">{title}</span>
{/if}
