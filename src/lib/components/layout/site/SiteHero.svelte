<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ExamSummary } from '#lib/domain/types';
	import { cn } from '#lib/utils/cn';
	import { site } from '#lib/settings/site';
	import Button from '#lib/components/ui/Buttons.svelte';
	import ExamTitle from '#lib/components/ui/ExamTitle.svelte';

	type Props = {
		exam: ExamSummary;
		class?: string;
	};

	let { exam, class: className }: Props = $props();

	const examHref = $derived(resolve('/portal/[exam]/start', { exam: exam.slug }));
	const infoExamHref = $derived(resolve('/portal/[exam]', { exam: exam.slug }));
</script>

<div
	class={cn('flex h-full w-full flex-col items-start justify-center lg:justify-evenly', className)}
>
	<div class="space-y-6">
		<p
			class="w-fit rounded bg-on-surface-muted px-1 py-0.5 font-mono text-xs font-bold text-surface-accent uppercase"
		>
			<ExamTitle title={exam.title} />
		</p>
		<h1 class="max-w-160 text-5xl leading-tight font-bold tracking-tight sm:text-6xl lg:-mt-4">
			{site.home.heroTitle}
		</h1>
		<p class="max-w-xl text-lg leading-relaxed font-medium text-pretty text-on-surface-muted">
			{site.home.heroSubtitle}
		</p>
	</div>
	<div class="mt-12 flex w-full flex-col items-stretch gap-4 sm:items-center md:flex-row">
		<Button variant="primary" size="lg" href={examHref} class="w-full md:w-60">
			{site.home.startCta}
		</Button>
		<Button variant="secondary" size="lg" href={infoExamHref} class="w-full md:w-60">
			{site.home.infoCta}
		</Button>
	</div>
</div>
