<script lang="ts">
	import { site } from '#lib/settings/site';
	import { cn } from '#lib/utils/cn';

	type Props = {
		/** Hide the mark below the `sm` breakpoint, as the session bars do. */
		responsive?: boolean;
		/** Draw the vertical rule after the mark. */
		separator?: boolean;
		class?: string;
	};

	let { responsive = true, separator = false, class: className }: Props = $props();

	const Logo = site.logo;
	const edge = $derived(responsive ? 'hidden sm:block' : undefined);
</script>

<Logo class={cn('shrink-0', edge, className)} aria-hidden="true" />
{#if separator}
	<span class={cn('h-3 w-0.5 shrink-0 bg-primary-accent', edge)} aria-hidden="true"></span>
{/if}
