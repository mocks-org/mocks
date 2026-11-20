<script lang="ts">
	import { site } from '#lib/settings/site';
	import ExternalLink from '#lib/components/ui/ExternalLink.svelte';
	import { cn } from '#lib/utils/cn';

	let { class: className }: { class?: string } = $props();
</script>

<nav aria-label="Licence links">
	<small class={cn('inline-flex flex-wrap items-center gap-2 font-semibold', className)}>
		{#each site.licenseLinks as license, index (license.label)}
			{#if index > 0}
				<span class="size-1 rounded bg-on-surface-muted" aria-hidden="true"></span>
			{/if}
			{#if license.prefix}{license.prefix}{/if}
			<ExternalLink href={license.href}>{license.label}</ExternalLink>
		{/each}
	</small>
</nav>
