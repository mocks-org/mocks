<script lang="ts">
	import type { PageProps } from './$types';
	import Home from '#theme/Home.svelte';
	import Seo from '#lib/components/seo/Seo.svelte';

	let { data }: PageProps = $props();
</script>

<Seo title={data.exam.title} />

<Home
	exam={data.exam}
	sampleQuestion={data.sampleQuestion}
	practiceAvailable={Boolean(data.exam.practiceBank)}
/>
