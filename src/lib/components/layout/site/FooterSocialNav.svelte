<script lang="ts">
	import { site } from '#lib/settings/site';
	import ExternalLink from '#lib/components/ui/ExternalLink.svelte';
	import { cn } from '#lib/utils/cn';

	let { class: className }: { class?: string } = $props();
</script>

{#if site.social.length > 0}
	<nav aria-label={`${site.name} social links`} class={cn(className)}>
		<small class="inline-flex flex-wrap items-center gap-2 font-semibold">
			{#each site.social as profile, index (profile.href)}
				{#if index > 0}
					<span class="size-1 rounded bg-on-surface-muted" aria-hidden="true"></span>
				{/if}
				<ExternalLink href={profile.href}>{profile.label}</ExternalLink>
			{/each}
		</small>
	</nav>
{/if}
