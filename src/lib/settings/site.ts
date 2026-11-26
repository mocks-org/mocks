import type { RouteId } from '$app/types';
// Icons (change logo here)
import Logo from '~icons/oxy/logo';

/** A link to a route inside the site. `id` must match a route that exists. */
export type SiteNavLink = {
	/** Route id, including the route group, for example `/(site)/about`. */
	id: RouteId;
	label: string;
};

/** A link that leaves the site. */
export type SiteExternalLink = {
	label: string;
	href: string;
	/** Optional text shown before the link, for example `Code:`. */
	prefix?: string;
};

/** A public profile shown beside the licence links in the footer. */
export type SiteSocialLink = {
	label: string;
	href: string;
};

/**
 * Brand, navigation, copy, and default metadata for the site.
 *
 * This is the file a template user edits to rebrand the deployment. The header,
 * footer, document head, homepage, and authoring defaults all read from here,
 * so changing the name once updates every place it appears.
 */
export const site = {
	/** Brand name */
	name: 'Mocks',

	/** Short phrase used when a page has no title of its own. */
	tagline: 'Unofficial practice exams',

	/** Default `<meta name="description">` and `og:description`. */
	description:
		'Free, unofficial practice exams for professional certifications, with instant results and no sign-up.',

	/**
	 * Public origin, used for canonical and Open Graph URLs. Set this to the
	 * deployed domain. It must not include a trailing slash.
	 */
	url: 'https://mocks.oxypteros.com',

	/** Document language, for example `en`. */
	locale: 'en',

	/**
	 * Exam slug shown on the homepage. When it is not seeded, the homepage falls
	 * back to the first published exam so a demo-only template still renders.
	 * The bundled demo exam slug is `cpacc-demo`.
	 */
	featuredExam: 'cpacc',

	/**
	 * Spoken forms for initialisms that a speech synthesizer should read as a
	 * word rather than letter by letter, for example `{ LEED: 'leed' }`.
	 * Initialisms not listed here are spelled out (`CPACC` becomes "C P A C C").
	 */
	pronunciations: {} as Record<string, string>,

	/** Logo mark shown beside the name. Swap the import above to change it. */
	logo: Logo,

	/** First year in the footer copyright range. */
	startYear: 2026,

	headerLinks: [{ id: '/(site)/about', label: 'About' }] as const satisfies readonly SiteNavLink[],

	footerLinks: [
		{ id: '/(site)/accessibility', label: 'Accessibility' }
	] as const satisfies readonly SiteNavLink[],

	social: [
		{ label: 'GitHub', href: 'https://github.com/mocks-org' }
	] as const satisfies readonly SiteSocialLink[],

	disclaimer:
		'Mocks is an independent, non-commercial, open-source platform. All certification names and trademarks are property of their respective owners.',

	/** Shown on exam pages, where the score could otherwise look official. */
	unofficialStatement:
		'Mocks is not affiliated with, endorsed by, or sponsored by the certification provider. Scores are practice feedback, not official results.',

	licenseLinks: [
		{
			prefix: 'Code:',
			label: 'MIT',
			href: 'https://github.com/mocks-org/mocks/blob/main/LICENSE'
		},
		{
			prefix: 'Content:',
			label: 'CC BY-SA 4.0',
			href: 'https://github.com/mocks-org/mocks-cpacc/blob/main/LICENSE'
		}
	] as const satisfies readonly SiteExternalLink[],

	credit: {
		/** Set to false to hide the author credit in the footer. */
		enabled: true
	},

	/**
	 * Homepage copy. The hero and practice blocks are structured because the
	 * practice list is rendered as a list, not as a paragraph.
	 */
	home: {
		/** Heading above the featured exam (the exam title is shown beside it) */
		heroTitle: 'Ready for a mock exam?',
		heroSubtitle: 'Free, unofficial practice built to simulate the real format.',
		startCta: 'Start a mock exam',
		infoCta: 'Learn more',
		sampleHeading: 'Not ready for the full exam?',
		sampleBody: 'Try one question from the practice bank and see how it feels.',
		practiceTitle: 'Practice Mode',
		practicePoints: ['No time limit.', 'Immediate feedback.', 'Loose question format.'],
		practiceCta: 'Start practicing',
		practiceUnavailable: 'Not available yet'
	}
};
