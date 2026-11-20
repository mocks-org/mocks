<script lang="ts">
	import type { Snippet } from 'svelte';
	import SkipLink from '#lib/components/layout/site/SkipLink.svelte';
	import { cn } from '#lib/utils/cn';

	type Props = {
		/** Renders the skip-to-main control above the bar. */
		skipLink?: boolean;
		/** Bar classes: sticky offsets and borders come from the theme. */
		class?: string;
		/** Inner container classes. */
		innerClass?: string;
		children: Snippet;
	};

	let { skipLink = false, class: className, innerClass, children }: Props = $props();
</script>

<!--
	Semantic shell for the exam-session chrome. The landmark and the skip link
	stay here so every route shares them; the bar's contents come from the theme.
-->
<header class={cn('border-b border-on-surface-muted bg-surface-accent', className)}>
	{#if skipLink}<SkipLink />{/if}
	<div
		class={cn(
			'mx-auto flex min-h-11 w-full max-w-8xl flex-wrap items-center justify-between gap-2 px-2 py-1 sm:px-4',
			innerClass
		)}
	>
		{@render children()}
	</div>
</header>
