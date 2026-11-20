import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { site } from '#lib/settings/site';
import { getBankRepository } from '#lib/server/repositories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const repository = getBankRepository(platform?.env.DB ?? env.DB);

	// Prefer the configured exam and fall back to the first published one, so a
	// template seeded with only the bundled demo pack still renders.
	let exam = await repository.getExam(site.featuredExam);

	if (!exam) {
		const [first] = await repository.listExams();
		exam = first ? await repository.getExam(first.slug) : null;
	}

	if (!exam) {
		error(
			503,
			'No published exam is available. Seed a pack with pnpm bank:seed:local, or the demo with pnpm db:seed:demo:local.'
		);
	}

	// The homepage sample comes from the practice bank: it is untimed and gives
	// instant feedback, which matches the sample interaction. Falls back to the
	// exam bank when no practice bank is published.
	const sampleQuestion = await repository.getSampleQuestion(exam.slug, undefined, 'practice');

	if (!sampleQuestion) {
		error(
			503,
			`${exam.title} has no published questions. Seed its bank before loading the homepage.`
		);
	}

	return { exam, sampleQuestion };
};
