import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { hasErrors } from '../../src/lib/authoring/schema.ts';
import {
	contentRoot,
	loadAllPacks,
	loadPackDir,
	readManifest,
	writeManifest,
	type LoadedPack
} from './packs.ts';
import { printIssues, repoRoot } from '../bank/source.ts';

/**
 * Content pack sync.
 *
 *   pnpm content:add <source> [--ref <sha>] [--source <manifest-source>]
 *   pnpm content:update [exam] [--ref <sha>]
 *   pnpm content:remove <exam>
 *   pnpm content:list
 *
 * A sync may only write under `content/`, and a pack may only contain the files
 * on the allowlist below. Everything is validated in a temp clone before the
 * destination is touched, so a broken pack never lands in the tree.
 */

const REPO_META = new Set(['.git', '.github', '.gitignore', '.gitattributes', '.gitKeep']);
const PACK_FILES = new Set(['exam.json', 'README.md', 'LICENSE', 'CONTRIBUTING.md']);

interface ResolvedSource {
	fetchUrl: string;
	display: string;
	isLocal: boolean;
}

interface FetchedPack {
	dir: string;
	sha: string;
}

interface ParsedArguments {
	command: string;
	positionals: string[];
	ref?: string;
	source?: string;
	dryRun: boolean;
	force: boolean;
}

function usage(): void {
	console.log(`Manage pinned content packs.

Usage:
  pnpm content:add <source> [--ref <sha>] [--source <manifest-source>] [--dry-run]
  pnpm content:update [exam] [--ref <sha>] [--dry-run]
  pnpm content:remove <exam> [--dry-run]
  pnpm content:list

Sources:
  https://github.com/owner/repo
  git@github.com:owner/repo
  github:owner/repo
  owner/repo
  ../path/to/local/pack

--source overrides what is written to content/packs.json. Use it when you sync
from a local checkout before the remote is pushed, for example:
  pnpm content:add ../mocks-cpacc --source github:mocks-org/mocks-cpacc`);
}

function parseArguments(argv: string[]): ParsedArguments {
	const [command = '', ...rest] = argv;
	const parsed: ParsedArguments = {
		command,
		positionals: [],
		dryRun: false,
		force: false
	};

	for (let index = 0; index < rest.length; index += 1) {
		const argument = rest[index];
		if (argument === '--dry-run') {
			parsed.dryRun = true;
			continue;
		}
		if (argument === '--force') {
			parsed.force = true;
			continue;
		}
		if (argument === '--ref') {
			parsed.ref = rest[index + 1];
			index += 1;
			continue;
		}
		if (argument.startsWith('--ref=')) {
			parsed.ref = argument.slice('--ref='.length);
			continue;
		}
		if (argument === '--source') {
			parsed.source = rest[index + 1];
			index += 1;
			continue;
		}
		if (argument.startsWith('--source=')) {
			parsed.source = argument.slice('--source='.length);
			continue;
		}
		if (argument.startsWith('--')) {
			throw new Error(`Unknown option ${argument}.`);
		}
		parsed.positionals.push(argument);
	}

	return parsed;
}

function git(args: string[], cwd: string): string {
	const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const detail = (result.stderr || result.stdout || '').trim();
		throw new Error(`git ${args.join(' ')} failed${detail ? `:\n${detail}` : '.'}`);
	}
	return (result.stdout ?? '').trim();
}

function normalizeSource(input: string, base = process.cwd()): ResolvedSource {
	let value = input.trim();
	if (!value) throw new Error('A pack source is required.');

	if (value.startsWith('github:')) value = value.slice('github:'.length);

	// `owner/repo` shorthand, unless it names a real local path.
	if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) && !existsSync(resolve(base, value))) {
		value = `https://github.com/${value}`;
	}

	if (/^git@github\.com:/i.test(value)) {
		const path = value
			.replace(/^git@github\.com:/i, '')
			.replace(/\.git$/i, '')
			.replace(/\/$/, '');
		return { fetchUrl: value, display: `https://github.com/${path}`, isLocal: false };
	}

	if (/^https?:\/\//i.test(value)) {
		const clean = value.replace(/\.git$/i, '').replace(/\/$/, '');
		return { fetchUrl: `${clean}.git`, display: clean, isLocal: false };
	}

	const absolute = resolve(base, value);
	if (!existsSync(absolute)) {
		throw new Error(`Pack source not found: ${value}`);
	}
	return { fetchUrl: absolute, display: value, isLocal: true };
}

function latestTag(dir: string): string | undefined {
	const tags = git(['tag', '--list', '--sort=-v:refname'], dir)
		.split('\n')
		.map((tag) => tag.trim())
		.filter(Boolean);
	return tags[0];
}

function fetchPack(
	source: ResolvedSource,
	options: { ref?: string; latestTag?: boolean } = {}
): FetchedPack {
	const dir = mkdtempSync(join(tmpdir(), 'mocks-pack-'));

	try {
		git(['clone', '--quiet', '--filter=blob:none', source.fetchUrl, dir], repoRoot);

		let ref = options.ref;
		if (!ref && options.latestTag) ref = latestTag(dir);
		if (ref) git(['checkout', '--quiet', '--detach', ref], dir);

		const sha = git(['rev-parse', 'HEAD'], dir);
		if (!/^[0-9a-f]{40}$/.test(sha)) {
			throw new Error(`Could not resolve a full commit SHA (got "${sha}").`);
		}
		return { dir, sha };
	} catch (error) {
		rmSync(dir, { recursive: true, force: true });
		throw error;
	}
}

function withFetchedPack<T>(
	source: ResolvedSource,
	options: { ref?: string; latestTag?: boolean },
	callback: (fetched: FetchedPack) => T
): T {
	const fetched = fetchPack(source, options);
	try {
		return callback(fetched);
	} finally {
		rmSync(fetched.dir, { recursive: true, force: true });
	}
}

function walkFiles(root: string): string[] {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const full = join(root, entry.name);
		if (entry.isDirectory()) return walkFiles(full);
		return entry.isFile() ? [full] : [];
	});
}

/** Reject anything the app does not know how to load. */
function assertAllowlisted(root: string): void {
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const name = entry.name;
		if (REPO_META.has(name)) continue;
		if (entry.isFile() && PACK_FILES.has(name)) continue;

		const bankRoot = join(root, name);
		if (entry.isDirectory() && existsSync(join(bankRoot, 'bank.json'))) {
			for (const nested of readdirSync(bankRoot, { withFileTypes: true })) {
				if (nested.isFile() && nested.name === 'bank.json') continue;
				if (nested.isDirectory() && nested.name === 'questions') {
					for (const file of walkFiles(join(bankRoot, 'questions'))) {
						if (!file.endsWith('.json')) {
							throw new Error(
								`Pack contains ${relative(root, file)}, but questions/ may only hold .json files.`
							);
						}
					}
					continue;
				}
				throw new Error(
					`Pack contains ${name}/${nested.name}, which is outside the allowlist. ` +
						'Allowed: exam.json, <kind>/bank.json, <kind>/questions/**, README.md, LICENSE, CONTRIBUTING.md.'
				);
			}
			continue;
		}

		throw new Error(
			`Pack contains ${name}, which is outside the allowlist. ` +
				'Allowed: exam.json, <kind>/bank.json, <kind>/questions/**, README.md, LICENSE, CONTRIBUTING.md.'
		);
	}
}

function assertInsideContent(destination: string): void {
	const path = relative(contentRoot, destination);
	if (!path || path.startsWith('..') || isAbsolute(path)) {
		throw new Error(`Refusing to write outside content/: ${destination}`);
	}
}

function copyPack(sourceDir: string, destination: string): void {
	assertInsideContent(destination);
	mkdirSync(contentRoot, { recursive: true });
	rmSync(destination, { recursive: true, force: true });
	mkdirSync(destination, { recursive: true });

	for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
		if (REPO_META.has(entry.name)) continue;
		if (entry.isFile() && !PACK_FILES.has(entry.name)) continue;

		const from = join(sourceDir, entry.name);
		const to = join(destination, entry.name);
		cpSync(from, to, { recursive: entry.isDirectory() });
	}
}

function reportPack(pack: LoadedPack, sha: string): void {
	console.log(`Pack: ${pack.name} — ${pack.exam.title}`);
	console.log(`Ref:  ${sha}`);
	for (const bank of pack.banks) {
		console.log(
			`  ${bank.bank.id} (${bank.bank.kind}) v${bank.bank.version}: ` +
				`${bank.questions.length} question(s), ${bank.placeholders.length} placeholder(s)`
		);
	}
}

function assertValid(pack: LoadedPack): void {
	let failed = false;
	for (const bank of pack.banks) {
		printIssues(bank.issues);
		if (hasErrors(bank.issues)) failed = true;
	}
	if (failed) {
		throw new Error('The pack has validation errors; nothing was written.');
	}
}

function assertNoIdCollisions(pack: LoadedPack): void {
	const used = new Map<string, string>();

	for (const existing of loadAllPacks()) {
		if (existing.name === pack.name) continue;
		for (const bank of existing.banks) {
			for (const item of bank.questions) {
				used.set(item.question.id, `${existing.name}/${bank.bank.id}`);
			}
		}
	}

	for (const bank of pack.banks) {
		for (const item of bank.questions) {
			const other = used.get(item.question.id);
			if (other) {
				throw new Error(
					`Question ID ${item.question.id} is already used by ${other}. ` +
						'IDs must be unique across every loaded pack.'
				);
			}
		}
	}
}

function commandAdd(parsed: ParsedArguments): void {
	const input = parsed.positionals[0];
	if (!input) throw new Error('content:add needs a source.');

	const source = normalizeSource(input);
	const manifest = readManifest();

	withFetchedPack(source, { ref: parsed.ref }, (fetched) => {
		assertAllowlisted(fetched.dir);
		const pack = loadPackDir(fetched.dir, { requireQuestions: true });
		reportPack(pack, fetched.sha);
		assertValid(pack);

		const destination = join(contentRoot, pack.name);
		if (manifest[pack.name] || existsSync(destination)) {
			if (!parsed.force) {
				throw new Error(
					`${pack.name} is already installed. Use \`pnpm content:update ${pack.name}\` ` +
						'or pass --force to replace it.'
				);
			}
		}
		assertNoIdCollisions(pack);

		if (parsed.dryRun) {
			console.log(`Dry run: would write content/${pack.name}/ and pin ${fetched.sha}.`);
			return;
		}

		copyPack(fetched.dir, destination);
		manifest[pack.name] = {
			source: parsed.source?.trim() || source.display,
			ref: fetched.sha
		};
		writeManifest(manifest);
		console.log(`Added ${pack.name} at ${fetched.sha}.`);
	});
}

function commandUpdate(parsed: ParsedArguments): void {
	const manifest = readManifest();
	const names = parsed.positionals[0] ? [parsed.positionals[0]] : Object.keys(manifest);

	if (names.length === 0) {
		console.log('No packs are pinned in content/packs.json.');
		return;
	}

	for (const name of names) {
		const entry = manifest[name];
		if (!entry) throw new Error(`"${name}" is not pinned in content/packs.json.`);

		const source = normalizeSource(entry.source, repoRoot);

		withFetchedPack(source, { ref: parsed.ref, latestTag: !parsed.ref }, (fetched) => {
			const pack = loadPackDir(fetched.dir, { requireQuestions: true });
			if (pack.name !== name) {
				throw new Error(
					`${entry.source} now contains "${pack.name}", but content/packs.json pins "${name}".`
				);
			}

			console.log(`\n${name}: ${entry.ref.slice(0, 12)} -> ${fetched.sha.slice(0, 12)}`);
			reportPack(pack, fetched.sha);
			assertValid(pack);
			assertNoIdCollisions(pack);

			if (parsed.dryRun) {
				console.log(`Dry run: would replace content/${name}/.`);
				return;
			}

			copyPack(fetched.dir, join(contentRoot, name));
			manifest[name] = {
				source: parsed.source?.trim() || entry.source,
				ref: fetched.sha
			};
		});
	}

	if (!parsed.dryRun) {
		writeManifest(manifest);
	}
}

function commandRemove(parsed: ParsedArguments): void {
	const name = parsed.positionals[0];
	if (!name) throw new Error('content:remove needs an exam.');

	const manifest = readManifest();
	if (!manifest[name]) throw new Error(`"${name}" is not pinned in content/packs.json.`);

	const destination = join(contentRoot, name);
	assertInsideContent(destination);

	if (parsed.dryRun) {
		console.log(`Dry run: would remove content/${name}/ and its manifest entry.`);
		return;
	}

	rmSync(destination, { recursive: true, force: true });
	delete manifest[name];
	writeManifest(manifest);
	console.log(`Removed ${name}.`);
}

function commandList(): void {
	const manifest = readManifest();
	const names = Object.keys(manifest).sort();

	if (names.length === 0) {
		console.log('No packs are pinned in content/packs.json.');
	} else {
		for (const name of names) {
			const entry = manifest[name];
			const destination = join(contentRoot, name);
			if (!existsSync(destination)) {
				console.log(`${name}\t${entry.ref.slice(0, 12)}\tmissing from content/`);
				continue;
			}

			try {
				const pack = loadPackDir(destination);
				const banks = pack.banks
					.map((bank) => `${bank.bank.id} (${bank.bank.kind}, ${bank.questions.length} q)`)
					.join(', ');
				console.log(`${name}\t${entry.ref.slice(0, 12)}\t${banks}`);
			} catch (error) {
				console.log(`${name}\t${entry.ref.slice(0, 12)}\tinvalid: ${(error as Error).message}`);
			}
		}
	}

	const demo = join(contentRoot, 'demo');
	if (existsSync(demo)) {
		const pack = loadPackDir(demo);
		const banks = pack.banks
			.map((bank) => `${bank.bank.id} (${bank.bank.kind}, ${bank.questions.length} q)`)
			.join(', ');
		console.log(`demo\tbundled\t${banks}`);
	}
}

function main(): void {
	const parsed = parseArguments(process.argv.slice(2));

	switch (parsed.command) {
		case 'add':
			commandAdd(parsed);
			break;
		case 'update':
			commandUpdate(parsed);
			break;
		case 'remove':
			commandRemove(parsed);
			break;
		case 'list':
			commandList();
			break;
		default:
			usage();
			process.exit(parsed.command ? 1 : 0);
	}
}

try {
	main();
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}
