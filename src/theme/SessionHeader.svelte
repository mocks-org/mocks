<script lang="ts">
	import type { Snippet } from 'svelte';
	import SessionHeaderShell from '#lib/components/layout/portal/SessionHeader.svelte';
	import BrandMark from '#lib/components/layout/site/BrandMark.svelte';
	import { cn } from '#lib/utils/cn';

	type Props = {
		/** Text beside the mark. Omit when `leading` carries the title. */
		title?: string;
		/** Show the logo mark and its separator. */
		brand?: boolean;
		/** Render the skip-to-main control. */
		skipLink?: boolean;
		/** Left-hand controls after the title, for example a Previous button. */
		leading?: Snippet;
		/** Right-hand controls: timer, fullscreen, review, exit. */
		actions?: Snippet;
		/** Set false for a bar that scrolls away with the page. */
		sticky?: boolean;
		class?: string;
		innerClass?: string;
	};

	let {
		title,
		brand = true,
		skipLink = true,
		leading,
		actions,
		sticky = true,
		class: className,
		innerClass
	}: Props = $props();
</script>

<!--
	FORK-OWNED FILE — the exam-session bar used by the lobby, the timed attempt,
	practice, the practice summary, results, and the authoring tool.
	Change the sticky offsets, sizes, order or which controls appear; the landmark
	and skip link stay in the #lib shell.
	Do not add aria-*, role, tabindex or landmark elements here.
	Run `pnpm theme:check` after editing.
-->
<SessionHeaderShell {skipLink} {innerClass} class={cn(sticky && 'sticky top-0 z-20', className)}>
	<div class="flex min-w-0 flex-wrap items-center gap-2">
		{#if brand}<BrandMark separator />{/if}
		{#if title}
			<p class="min-w-0 truncate text-sm font-semibold text-on-surface">{title}</p>
		{/if}
		{@render leading?.()}
	</div>

	{#if actions}
		<div class="flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</SessionHeaderShell>
