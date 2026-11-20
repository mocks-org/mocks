<script lang="ts">
	import Button from '#lib/components/ui/Buttons.svelte';
	import { cn } from '#lib/utils/cn';

	let { class: className }: { class?: string } = $props();
</script>

<Button
	variant="secondary"
	size="sm"
	href="#main-content"
	class={cn(
		'absolute left-2 z-99 -translate-y-24 rounded px-px focus-visible:translate-y-2',
		className
	)}
>
	Skip to main
</Button>
