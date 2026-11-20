import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { z } from 'zod';
import {
	bankMetaSchema,
	examConfigSchema,
	type ExamConfig,
	type SourceIssue
} from '../../src/lib/authoring/bank-source.ts';
import { SUPPORTED_SCHEMA_VERSIONS } from '../../src/lib/authoring/schema.ts';
import { loadBankSource, repoRoot, type BankSource } from '../bank/source.ts';

/**
 * Content packs
 *
 * The app ships a bundled `content/demo` pack and learns about every other exam
 * from `content/packs.json`. A pack is one exam directory shaped exactly like
 * `content/<exam>`: `exam.json` plus one directory per bank kind.
 *
 * This module is the only place that reads the manifest. Everything that walks
 * content (validate/build/seed/sync) goes through `loadAllPacks()` so the
 * cross-pack rules are applied once.
 */

export const contentRoot = join(repoRoot, 'content');
export const manifestPath = join(contentRoot, 'packs.json');

/** The bundled demo pack is not in the manifest and is never synced. */
export const BUNDLED_PACK = 'demo';

const packEntrySchema = z.object({
	/** Where the pack comes from, for example `https://github.com/o/r`. */
	source: z.string().trim().min(1, 'A pack needs a source.'),
	/** Full commit SHA. A branch or tag would make the build unreproducible. */
	ref: z
		.string()
		.trim()
		.regex(/^[0-9a-f]{40}$/, 'A pack ref must be a full 40-character commit SHA.')
});

export type PackEntry = z.infer<typeof packEntrySchema>;
export type Manifest = Record<string, PackEntry>;

export interface LoadedPack {
	/** Manifest key and directory name, for example `cpacc`. */
	name: string;
	/** `content/<name>` or the pack root passed to `loadPackDir()`. */
	dir: string;
	exam: ExamConfig;
	/** One source per bank kind (`exam`, `practice`, ...). */
	banks: BankSource[];
}

/**
 * A pack directory described without reading any questions.
 *
 * `pnpm content:check` uses this to assert the manifest, the directory names,
 * and the schema versions agree. Loading every question is the job of
 * `loadAllPacks()`, which builds on the same layout check so the two can never
 * disagree about what a pack is.
 */
export interface PackLayout {
	/** Directory name (the manifest key) or the pack root's basename. */
	name: string;
	/** Absolute pack root. */
	dir: string;
	exam: ExamConfig;
	/** Bank kinds present on disk (`exam`, `practice`, ...). */
	kinds: string[];
	/** `schemaVersion` declared by each bank, keyed by kind. */
	schemaVersions: Record<string, number>;
}

export interface ContentInspection {
	manifest: Manifest;
	/** Packs whose directory agrees with the manifest and has a supported schema. */
	layouts: PackLayout[];
	/** Every disagreement found while walking `content/`. Empty means consistent. */
	errors: string[];
}

function readJson(file: string, label: string): unknown {
	if (!existsSync(file)) throw new Error(`Missing ${label}: ${file}`);
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${(error as Error).message}`, { cause: error });
	}
}

function formatIssues(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
		.join('\n');
}

export function readManifest(): Manifest {
	if (!existsSync(manifestPath)) {
		throw new Error(
			`Missing ${manifestPath}. Create it with \`{}\` or add a pack with \`pnpm content:add\`.`
		);
	}

	const manifest = z
		.record(z.string(), packEntrySchema)
		.safeParse(readJson(manifestPath, 'content/packs.json'));
	if (!manifest.success) {
		throw new Error(`content/packs.json is invalid:\n${formatIssues(manifest.error)}`);
	}
	return manifest.data;
}

export function writeManifest(manifest: Manifest): void {
	const sorted = Object.fromEntries(
		Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right))
	);
	writeFileSync(manifestPath, `${JSON.stringify(sorted, null, '\t')}\n`);
}

/** Every `content/*` directory that looks like a pack. */
export function packDirs(): string[] {
	if (!existsSync(contentRoot)) return [];
	return readdirSync(contentRoot, { withFileTypes: true })
		.filter(
			(entry) => entry.isDirectory() && existsSync(join(contentRoot, entry.name, 'exam.json'))
		)
		.map((entry) => entry.name)
		.sort();
}

/** A pack root has `exam.json`; a bank root has `bank.json`. */
export function isPackRoot(dir: string): boolean {
	return existsSync(join(dir, 'exam.json'));
}

export function isBankRoot(dir: string): boolean {
	return existsSync(join(dir, 'bank.json'));
}

/** Bank kinds present under a pack root (`exam`, `practice`, ...). */
export function bankDirs(root: string): string[] {
	return readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, 'bank.json')))
		.map((entry) => entry.name)
		.sort();
}

function assertSchemaVersion(root: string, bank: string): void {
	const file = join(root, bank, 'bank.json');
	const raw = readJson(file, `${bank}/bank.json`) as { schemaVersion?: unknown };
	const version = raw.schemaVersion;
	const supported = SUPPORTED_SCHEMA_VERSIONS as readonly number[];
	if (typeof version !== 'number' || !supported.includes(version)) {
		throw new Error(
			`${bank}/bank.json uses schemaVersion ${String(version)}, but this app supports ` +
				`${supported.join(' and ')}. Update the pack or migrate it first.`
		);
	}
}

/**
 * Describe one pack directory: `exam.json`, its bank kinds, and their schema
 * versions. Question files are not read, so this is cheap enough for CI.
 *
 * The schema-version message is checked before the full `bank.json` parse, so an
 * incompatible pack reports "this app supports N and N-1" instead of a wall of
 * field errors that the older schema would not understand anyway.
 */
function readPackLayout(root: string): PackLayout {
	const exam = examConfigSchema.safeParse(readJson(join(root, 'exam.json'), 'exam.json'));
	if (!exam.success) {
		throw new Error(`exam.json is invalid:\n${formatIssues(exam.error)}`);
	}

	const kinds = bankDirs(root);
	if (kinds.length === 0) {
		throw new Error(`No bank directories found under ${root} (expected exam/ or practice/).`);
	}

	const schemaVersions: Record<string, number> = {};
	for (const kind of kinds) {
		assertSchemaVersion(root, kind);

		const meta = bankMetaSchema.safeParse(
			readJson(join(root, kind, 'bank.json'), `${kind}/bank.json`)
		);
		if (!meta.success) {
			throw new Error(`${kind}/bank.json is invalid:\n${formatIssues(meta.error)}`);
		}
		if (meta.data.exam !== exam.data.slug) {
			throw new Error(
				`${kind}/bank.json targets ${meta.data.exam}, but ${root}/exam.json defines ` +
					`${exam.data.slug}.`
			);
		}
		schemaVersions[kind] = meta.data.schemaVersion;
	}

	return { name: basename(root), dir: root, exam: exam.data, kinds, schemaVersions };
}

/**
 * Load one pack from a directory that contains `exam.json`.
 *
 * Works for `content/<exam>` and for a pack checkout such as `../mocks-CPACC`,
 * which is what `pnpm bank:validate ../mocks-CPACC` uses.
 */
export function loadPackDir(dir: string, options: { requireQuestions?: boolean } = {}): LoadedPack {
	const layout = readPackLayout(resolve(dir));
	const banks = layout.kinds.map((kind) => loadBankSource(join(layout.dir, kind), options));

	return { name: layout.exam.slug, dir: layout.dir, exam: layout.exam, banks };
}

function addCrossPackIssues(packs: LoadedPack[]): void {
	const seen = new Map<string, { pack: string; bank: string; file: string }>();

	for (const pack of packs) {
		for (const bank of pack.banks) {
			for (const item of bank.questions) {
				const id = item.question.id;
				const previous = seen.get(id);
				if (!previous) {
					seen.set(id, { pack: pack.name, bank: bank.bank.id, file: item.file });
					continue;
				}

				const issue: SourceIssue = {
					file: item.file,
					path: 'id',
					message:
						`Question ID ${id} is already used by ${previous.pack}/${previous.bank} ` +
						`(${previous.file}). IDs must be unique across every loaded pack.`,
					severity: 'error'
				};
				bank.issues.push(issue);
			}
		}
	}
}

/**
 * Walk `content/` and report every disagreement between the manifest, the pack
 * directories, and the schema versions the app supports.
 *
 * This is the check `pnpm content:check` runs in CI. It is deliberately a pure
 * description: no questions are read, so a pull request that only moves a pin
 * still gets a fast, precise failure when the manifest and the tree diverge.
 */
export function inspectContent(): ContentInspection {
	const manifest = readManifest();
	const names = [...new Set([...Object.keys(manifest), ...packDirs()])].sort();
	const layouts: PackLayout[] = [];
	const errors: string[] = [];

	for (const name of names) {
		const dir = join(contentRoot, name);
		if (!existsSync(dir)) {
			errors.push(`content/packs.json pins "${name}", but content/${name}/ does not exist.`);
			continue;
		}
		if (!isPackRoot(dir)) {
			errors.push(`content/${name}/ is not a pack (missing exam.json).`);
			continue;
		}
		if (name === BUNDLED_PACK) {
			if (manifest[name]) {
				errors.push(
					`content/${BUNDLED_PACK}/ is bundled and must not be pinned in content/packs.json.`
				);
				continue;
			}
		} else if (!manifest[name]) {
			errors.push(
				`content/${name}/ is not pinned in content/packs.json. ` +
					`Add it with \`pnpm content:add\` or remove the directory.`
			);
			continue;
		}

		try {
			const layout = readPackLayout(dir);
			if (name !== BUNDLED_PACK && layout.exam.slug !== name) {
				errors.push(
					`content/${name}/exam.json defines slug "${layout.exam.slug}". ` +
						`The directory name and manifest key must match the exam slug.`
				);
				continue;
			}
			layouts.push(layout);
		} catch (error) {
			errors.push(`content/${name}/: ${(error as Error).message}`);
		}
	}

	// Two directories claiming the same exam would load the same exam twice and
	// make question-ID collisions certain.
	const slugs = new Map<string, string>();
	for (const layout of layouts) {
		const previous = slugs.get(layout.exam.slug);
		if (previous) {
			errors.push(
				`content/${layout.name}/ and content/${previous}/ both define exam slug ` +
					`"${layout.exam.slug}". Exam slugs must be unique.`
			);
		} else {
			slugs.set(layout.exam.slug, layout.name);
		}
	}

	return { manifest, layouts, errors };
}

/**
 * Load every pack: the manifest entries plus the bundled demo.
 *
 * Manifest and directory disagreements are errors, not warnings: a directory
 * without a pin is unreproducible, and a pin without content is a broken build.
 */
export function loadAllPacks(options: { requireQuestions?: boolean } = {}): LoadedPack[] {
	const { layouts, errors } = inspectContent();
	if (errors.length > 0) throw new Error(errors.join('\n'));

	const packs: LoadedPack[] = layouts.map((layout) => ({
		// The directory/manifest key is the pack identity; the exam slug is the
		// content identity. They match for pinned packs, but the bundled demo
		// keeps its historical `cpacc-demo` exam slug.
		name: layout.name,
		dir: layout.dir,
		exam: layout.exam,
		banks: layout.kinds.map((kind) => loadBankSource(join(layout.dir, kind), options))
	}));

	addCrossPackIssues(packs);
	return packs;
}

/** Only the pinned packs, for `content:list` and sync bookkeeping. */
export function loadManifestPacks(): LoadedPack[] {
	return loadAllPacks().filter((pack) => pack.name !== BUNDLED_PACK);
}
