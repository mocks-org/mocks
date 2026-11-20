<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { site } from '#lib/settings/site';
	import { cn } from '#lib/utils/cn';

	let { class: className }: { class?: string } = $props();

	const startYear = site.startYear;
	const currentYear = $derived(new Date().getFullYear());
	const displayYear = $derived(
		currentYear === startYear
			? startYear.toString()
			: `${startYear}-${currentYear.toString().slice(-2)}`
	);

	const homeHref = resolve('/(site)');
	const isHome = $derived(page.route.id === '/(site)');
</script>

<small class={cn('flex items-center gap-2', className)}>
	<a
		href={homeHref}
		class="oxy-focus flex items-center gap-2 rounded px-px"
		aria-current={isHome ? 'page' : undefined}
	>
		<span class="font-mono text-xl font-black tracking-tight text-on-surface-muted uppercase">
			{site.name}
		</span>
		<span class="sr-only"> Home</span>
	</a>
	<span class="size-1 rounded bg-on-surface-muted" aria-hidden="true"></span>
	<span>&copy; {displayYear}</span>
</small>
