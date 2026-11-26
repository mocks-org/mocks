<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { RouteId } from '$app/types';
	import { site } from '#lib/settings/site';
	import Button from '#lib/components/ui/Buttons.svelte';
	import { cn } from '#lib/utils/cn';

	type NavLink = { id: RouteId; label: string };

	type Props = {
		links: readonly NavLink[];
		/** Selects the accessible name, the theme never supplies it. */
		kind: 'header' | 'footer';
		/** `end` right-aligns the list from the `sm` breakpoint. */
		align?: 'start' | 'end';
		class?: string;
	};

	let { links, kind, align = 'start', class: className }: Props = $props();

	const label = $derived(
		kind === 'header' ? `${site.name} header links` : `${site.name} informative links`
	);
	const isEnd = $derived(align === 'end');

	/**
	 * `resolve()` is overloaded per route id, so a union of static ids matches
	 * no overload -- a nav list used to break as soon as it held two links.
	 * Site nav links are always static routes (no `[param]`), so narrowing here
	 * fixes that without losing the `RouteId` check on `links`.
	 */
	const hrefFor = (id: RouteId) => resolve(id as '/(site)');
</script>

{#snippet linkButton(item: NavLink)}
	{@const isCurrent = page.route.id === item.id}
	<Button
		variant="navLink"
		size="navLink"
		href={hrefFor(item.id)}
		aria-current={isCurrent ? 'page' : undefined}
		class="px-0 aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4"
	>
		{item.label}
	</Button>
{/snippet}

<nav aria-label={label} class={cn('flex', isEnd && 'sm:justify-end', className)}>
	{#if links.length > 1}
		<ul class="flex flex-wrap gap-4">
			{#each links as item (item.id)}
				<li>
					{@render linkButton(item)}
				</li>
			{/each}
		</ul>
	{:else if links.length === 1}
		{@render linkButton(links[0])}
	{/if}
</nav>
