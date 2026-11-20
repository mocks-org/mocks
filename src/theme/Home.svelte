<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ExamSummary, SampleQuestion } from '#lib/domain/types';
	import { site } from '#lib/settings/site';
	import Button from '#lib/components/ui/Buttons.svelte';
	import SiteHero from '#lib/components/layout/site/SiteHero.svelte';
	import SiteExamDetails from '#lib/components/layout/site/ExamDetails.svelte';
	import SiteSampleQuestion from '#lib/components/layout/site/SiteSampleQuestion.svelte';

	type Props = {
		exam: ExamSummary;
		sampleQuestion: SampleQuestion;
		/** False when the exam has no practice bank (ADR-043). */
		practiceAvailable?: boolean;
	};

	let { exam, sampleQuestion, practiceAvailable = true }: Props = $props();

	const practiceHref = $derived(resolve('/portal/[exam]/practice', { exam: exam.slug }));
</script>

<!--
	FORK-OWNED FILE — the homepage body.
	The hero, exam facts and sample-question player are #lib components; this
	file decides their arrangement, spacing and the surrounding copy blocks.
	Do not add aria-*, role, tabindex or landmark elements here.
	Run `pnpm theme:check` after editing.
-->
<div class="grid items-start gap-10 py-16 lg:grid-cols-[1.15fr_0.65fr] lg:gap-16 lg:py-24">
	<SiteHero {exam} />
	<SiteExamDetails {exam} variant="stacked" />
</div>

<section class="pb-16 sm:pb-24 lg:mt-12" aria-labelledby="sample-question-heading">
	<h2
		id="sample-question-heading"
		class="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
	>
		{site.home.sampleHeading}
	</h2>
	<p class="mt-3 text-base text-pretty text-on-surface-muted">
		{site.home.sampleBody}
	</p>
	<div class="grid gap-10 lg:grid-cols-[1.15fr_0.65fr] lg:items-start lg:gap-16">
		<SiteSampleQuestion
			{exam}
			question={sampleQuestion}
			bankKind="practice"
			{practiceAvailable}
			class="mt-12"
		/>

		<div class="mt-12 lg:border-l-2 lg:border-on-surface lg:pl-8">
			<h3 class="text-3xl font-bold sm:text-4xl">{site.home.practiceTitle}</h3>
			<ul
				class="mt-4 list-disc space-y-2 pl-8 text-lg leading-relaxed marker:text-on-surface-muted"
			>
				{#each site.home.practicePoints as point (point)}
					<li>{point}</li>
				{/each}
			</ul>

			{#if practiceAvailable}
				<Button variant="secondary" size="md" class="mt-12 w-full" href={practiceHref}>
					{site.home.practiceCta}
				</Button>
			{:else}
				<Button variant="secondary" size="md" class="mt-12 w-full" disabled>
					{site.home.practiceUnavailable}
				</Button>
			{/if}
		</div>
	</div>
</section>
