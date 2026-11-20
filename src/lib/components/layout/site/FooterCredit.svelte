<script lang="ts">
	import { site } from '#lib/settings/site';
	import Tooltip from '#lib/components/ui/Tooltip.svelte';
	import { cn } from '#lib/utils/cn';

	import IconPi from '~icons/oxy/pi';

	let { class: className }: { class?: string } = $props();
</script>

{#if site.credit.enabled}
	<div class={cn('flex w-full justify-end', className)}>
		<Tooltip text="Designed and developed by Oxypteros">
			{#snippet link({ props })}
				<a
					{...props}
					href="https://oxypteros.com"
					target="_blank"
					rel="external noreferrer"
					class="oxy-focus rounded px-px"
				>
					<IconPi class="size-2.75" aria-hidden="true" />
					<span class="sr-only">Designed and developed by Oxypteros (opens in a new tab)</span>
				</a>
			{/snippet}
		</Tooltip>
	</div>
{/if}
