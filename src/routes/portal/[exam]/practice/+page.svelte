<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PracticeFeedback } from '#lib/domain/practice';
	import type { PracticeQuestion } from '#lib/domain/types';
	import Button from '#lib/components/ui/Buttons.svelte';
	import Seo from '#lib/components/seo/Seo.svelte';
	import FullscreenButton from '#lib/components/layout/portal/FullscreenButton.svelte';
	import QuestionPlayer from '#lib/components/layout/portal/QuestionPlayer.svelte';
	import ExamReviewDialog from '#lib/components/layout/portal/ExamReviewDialog.svelte';
	import PracticeFooter from '#lib/components/layout/portal/PracticeFooter.svelte';
	import SessionHeader from '#theme/SessionHeader.svelte';
	import {
		createPracticeSession,
		readPracticeSession,
		writePracticeSession,
		type StoredPracticeSession
	} from '#lib/utils/practice-storage';

	// Icons
	import IconLoadQuestion from '~icons/oxy/database-search';

	let { data }: PageProps = $props();

	const questionsEndpoint = $derived(
		resolve('/portal/[exam]/practice/questions', { exam: data.exam.slug })
	);
	const summaryHref = $derived(
		resolve('/portal/[exam]/practice/summary', { exam: data.exam.slug })
	);
	const examHref = $derived(resolve('/portal/[exam]', { exam: data.exam.slug }));

	let session = $state<StoredPracticeSession | null>(null);
	let loading = $state(true);
	let errorMessage = $state('');
	/** The current, not yet checked selection. Navigating away discards it  */
	let pending = $state<string | null>(null);
	let reviewOpen = $state(false);
	let reviewButton = $state<HTMLElement | null>(null);

	const total = $derived(session?.questions.length ?? 0);
	const currentIndex = $derived(session?.currentIndex ?? 0);
	const question = $derived(session ? (session.questions[currentIndex] ?? null) : null);
	const committed = $derived(session && question ? (session.answers[question.id] ?? null) : null);
	const selectedOptionId = $derived(pending ?? committed);

	const feedback = $derived.by((): PracticeFeedback | null => {
		if (!question || !committed) return null;

		const selected = question.options.find((option) => option.id === committed);
		const correct = question.options.find((option) => option.isCorrect);
		if (!selected || !correct) return null;

		return {
			correctOptionId: correct.id,
			correctLabel: correct.shortLabel,
			correctText: correct.text,
			correctRationale: correct.rationale,
			selectedLabel: selected.shortLabel,
			selectedText: selected.text,
			selectedRationale: selected.rationale,
			correct: selected.isCorrect,
			explanation: question.explanation,
			references: question.references
		};
	});

	onMount(() => {
		const handleExitRequest = () => {
			if (!reviewOpen) return;
			reviewOpen = false;
		};

		window.addEventListener('mocks:practice-exit-request', handleExitRequest);

		const stored = readPracticeSession(data.exam.slug);

		if (stored) {
			session = stored;
			loading = false;
			void focusHeading();
		} else {
			void loadQuestions();
		}

		return () => window.removeEventListener('mocks:practice-exit-request', handleExitRequest);
	});

	async function loadQuestions() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch(questionsEndpoint, {
				headers: { accept: 'application/json' }
			});

			if (!response.ok) {
				errorMessage =
					response.status === 409
						? 'Practice is not available for this exam yet. Its practice bank may still be in review.'
						: 'The practice questions could not be loaded. Check your connection and try again.';
				return;
			}

			const payload = (await response.json()) as { questions?: PracticeQuestion[] };

			if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
				errorMessage = 'The practice questions could not be loaded. Please try again.';
				return;
			}

			session = createPracticeSession(data.exam.slug, payload.questions);
			writePracticeSession(session);
		} catch {
			errorMessage =
				'The practice questions could not be loaded. Check your connection and try again.';
		} finally {
			loading = false;
		}

		if (session) await focusHeading();
	}

	async function focusHeading() {
		await tick();
		requestAnimationFrame(() => document.getElementById('question-heading')?.focus());
	}

	function persist() {
		if (session) writePracticeSession(session);
	}

	function selectOption(optionId: string) {
		if (!session || !question || committed) return;

		pending = optionId;
	}

	async function checkAnswer() {
		if (!session || !question || !pending || committed) return;

		session.answers[question.id] = pending;
		persist();

		// Announce the result with focus instead of a separate live region, so it
		// is not read twice.
		await tick();
		document.getElementById('practice-feedback')?.focus();
	}

	function goTo(index: number) {
		if (!session) return;

		const nextIndex = Math.min(Math.max(index, 0), session.questions.length - 1);
		if (nextIndex === session.currentIndex) return;

		session.currentIndex = nextIndex;
		pending = null;
		persist();
		void focusHeading();
	}

	function skipQuestion() {
		if (!session) return;

		if (session.currentIndex === session.questions.length - 1) {
			void goto(summaryHref);
			return;
		}

		goTo(session.currentIndex + 1);
	}

	function handleReviewOpenChange(open: boolean) {
		reviewOpen = open;

		if (!open) {
			reviewButton?.focus();
		}
	}

	function handleReviewSelect(index: number) {
		reviewOpen = false;
		goTo(index);
		void focusHeading();
	}
</script>

<Seo title="Practice — {data.exam.title}" index={false} />

<div class="flex min-h-dvh flex-col">
	{#if session}
		<SessionHeader brand title="Practice Session">
			{#snippet actions()}
				<FullscreenButton />
			{/snippet}
		</SessionHeader>
	{:else}
		<SessionHeader brand={false} title="Loading practice…" />
	{/if}

	<main
		id="main-content"
		tabindex="-1"
		class="mx-auto flex w-full max-w-8xl flex-1 justify-center px-4 py-8 pb-28 sm:px-6 lg:pt-12"
	>
		{#if loading}
			<p role="status" class="text-medium self-center text-on-surface">
				<span class="inline-flex items-center gap-2">
					<IconLoadQuestion class="size-4 text-dark" aria-hidden="true" />Finding your practice
					questions…
				</span>
			</p>
		{:else if errorMessage}
			<div
				role="alert"
				class="h-fit w-full max-w-xl rounded border-2 border-on-wrong-surface bg-wrong-surface p-5"
			>
				<h1 class="text-lg font-bold">Practice session could not start</h1>
				<p class="mt-2 text-sm leading-relaxed text-on-wrong-surface">
					{errorMessage}
				</p>
				<div class="mt-6 flex flex-wrap justify-between gap-2">
					<Button type="button" onclick={loadQuestions}>Try again</Button>
					<Button variant="secondary" href={examHref}>Back to the exam</Button>
				</div>
			</div>
		{:else if session && question}
			<QuestionPlayer
				mode="practice"
				{question}
				number={currentIndex + 1}
				{total}
				{selectedOptionId}
				{feedback}
				isLast={currentIndex === total - 1}
				onselect={selectOption}
				oncheck={checkAnswer}
				onskip={skipQuestion}
				onnext={() => goTo(currentIndex + 1)}
				onfinish={() => void goto(summaryHref)}
			/>
		{/if}
	</main>
</div>

{#if session}
	<PracticeFooter exam={data.exam} />
{/if}

{#if session && question}
	<ExamReviewDialog
		open={reviewOpen}
		onOpenChange={handleReviewOpenChange}
		questions={session.questions}
		answers={session.answers}
		flags={{}}
		{currentIndex}
		showFlags={false}
		onselect={handleReviewSelect}
	/>
{/if}
