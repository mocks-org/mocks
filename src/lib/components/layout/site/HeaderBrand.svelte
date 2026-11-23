<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { site } from '#lib/settings/site';
	import { cn } from '#lib/utils/cn';

	type Props = {
		class?: string;
		/** Applied to the logo mark only. */
		logoClass?: string;
	};

	let { class: className, logoClass }: Props = $props();

	const Logo = site.logo;
	const homeHref = resolve('/(site)');
	const isHome = $derived(page.route.id === '/(site)');
</script>

<a
	href={homeHref}
	class={cn('oxy-focus flex w-fit shrink-0 items-center gap-2 rounded px-px', className)}
	aria-current={isHome ? 'page' : undefined}
>
	<Logo class={logoClass} aria-hidden="true" />
	<span class="font-mono text-xl font-black tracking-tight text-on-surface-muted uppercase">
		{site.name}
	</span>
	<span class="sr-only"> Home</span>
</a>
