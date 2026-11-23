<script lang="ts">
	import { browser } from '$app/env';
	import { afterNavigate } from '$app/navigation';
	import Header from '#theme/Header.svelte';
	import Footer from '#theme/Footer.svelte';

	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	afterNavigate(({ from }) => {
		if (!browser || !from) return;
		document.getElementById('main-content')?.focus();
	});
</script>

<div class="flex min-h-dvh flex-col">
	<header>
		<Header />
	</header>

	<main id="main-content" tabindex="-1" class="mx-auto w-full max-w-6xl flex-1 px-3 sm:px-6">
		{@render children()}
	</main>
	<footer class="w-full">
		<Footer />
	</footer>
</div>
