import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Render the pull-request body for a content sync.
 *
 * `.github/workflows/sync-content.yml` runs this after `content:update` and
 * before it commits. The old tree is read from git (`HEAD` by default) and the
 * new tree from the working directory, so the body shows both the pinned-SHA
 * move and the question-count delta per module regardless of which packs moved.
 *
 *   node scripts/content/pr-body.ts [--base <git-ref>] > pr-body.md
 */

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = join(repoRoot, 'content');
const manifestPath = join(contentRoot, 'packs.json');

interface PackEntry {
	source: string;
	ref: string;
}

type Manifest = Record<string, PackEntry>;

/** pack -> "kind / module" -> number of question files. */
type Counts = Map<string, Map<string, number>>;

function parseBase(): string {
	const args = process.argv.slice(2);
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === '--base') return args[index + 1] ?? 'HEAD';
		if (argument.startsWith('--base=')) return argument.slice('--base='.length);
	}
	return 'HEAD';
}

function git(args: string[]): string {
	return execFileSync('git', args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	}).trim();
}

function readManifestFromGit(base: string): Manifest {
	try {
		return JSON.parse(git(['show', `${base}:content/packs.json`])) as Manifest;
	} catch {
		// First sync in a repository whose base has no manifest yet.
		return {};
	}
}

function readManifestFromDisk(): Manifest {
	if (!existsSync(manifestPath)) return {};
	return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
}

function filesAt(base: string): string[] {
	try {
		const output = git(['ls-tree', '-r', '--name-only', base, '--', 'content']);
		return output ? output.split('\n').filter(Boolean) : [];
	} catch {
		return [];
	}
}

function walk(root: string): string[] {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const full = join(root, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.isFile() ? [full] : [];
	});
}

function filesNow(): string[] {
	if (!existsSync(contentRoot)) return [];
	return walk(contentRoot).map((file) => relative(repoRoot, file).split(sep).join('/'));
}

/** Count question files per `<pack>/<kind>/questions/<module>/`. */
function countQuestions(files: string[]): Counts {
	const counts: Counts = new Map();

	for (const file of files) {
		// content/<pack>/<kind>/questions/<module>/<question>.json
		const parts = file.split('/');
		if (parts.length < 6 || parts[0] !== 'content') continue;
		const [, pack, kind, questions, module] = parts;
		if (questions !== 'questions' || !file.endsWith('.json')) continue;

		const modules = counts.get(pack) ?? new Map<string, number>();
		const key = `${kind} / ${module}`;
		modules.set(key, (modules.get(key) ?? 0) + 1);
		counts.set(pack, modules);
	}

	return counts;
}

function sourceUrl(source: string): string | undefined {
	let value = source.trim();
	if (value.startsWith('github:')) value = `https://github.com/${value.slice('github:'.length)}`;
	else if (/^git@github\.com:/i.test(value)) {
		value = `https://github.com/${value.replace(/^git@github\.com:/i, '')}`;
	} else if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
		value = `https://github.com/${value}`;
	}
	if (!/^https?:\/\//i.test(value)) return undefined;
	return value.replace(/\.git$/i, '').replace(/\/$/, '');
}

function shortRef(ref: string | undefined): string {
	return ref ? `\`${ref.slice(0, 12)}\`` : '—';
}

function delta(before: number, after: number): string {
	const change = after - before;
	if (change === 0) return '0';
	return change > 0 ? `+${change}` : String(change);
}

function moduleKeys(before: Map<string, number>, after: Map<string, number>): string[] {
	return [...new Set([...before.keys(), ...after.keys()])].sort();
}

function renderPack(
	name: string,
	oldEntry: PackEntry | undefined,
	newEntry: PackEntry | undefined,
	before: Map<string, number>,
	after: Map<string, number>
): string[] {
	const lines: string[] = [];
	lines.push(`### \`${name}\``);
	lines.push('');

	const url = sourceUrl(newEntry?.source ?? oldEntry?.source ?? '');
	if (url) {
		lines.push(`**Source:** ${url}`);
		lines.push('');
	}

	lines.push('| Pack | Before | After |');
	lines.push('| --- | --- | --- |');
	lines.push(`| \`${name}\` | ${shortRef(oldEntry?.ref)} | ${shortRef(newEntry?.ref)} |`);
	lines.push('');

	const keys = moduleKeys(before, after);
	if (keys.length > 0) {
		let beforeTotal = 0;
		let afterTotal = 0;

		lines.push('| Bank / module | Before | After | Change |');
		lines.push('| --- | ---: | ---: | ---: |');
		for (const key of keys) {
			const oldCount = before.get(key) ?? 0;
			const newCount = after.get(key) ?? 0;
			beforeTotal += oldCount;
			afterTotal += newCount;
			lines.push(`| ${key} | ${oldCount} | ${newCount} | ${delta(oldCount, newCount)} |`);
		}
		lines.push(
			`| **Total** | **${beforeTotal}** | **${afterTotal}** | **${delta(beforeTotal, afterTotal)}** |`
		);
		lines.push('');
	}

	if (url) {
		const links = [`[Release notes](${url}/releases)`];
		if (oldEntry?.ref && newEntry?.ref && oldEntry.ref !== newEntry.ref) {
			links.push(
				`[Compare \`${oldEntry.ref.slice(0, 12)}\`...\`${newEntry.ref.slice(0, 12)}\`](${url}/compare/${oldEntry.ref}...${newEntry.ref})`
			);
		}
		lines.push(links.join(' · '));
		lines.push('');
	}

	return lines;
}

const base = parseBase();
const oldManifest = readManifestFromGit(base);
const newManifest = readManifestFromDisk();
const oldCounts = countQuestions(filesAt(base));
const newCounts = countQuestions(filesNow());

const names = [...new Set([...Object.keys(oldManifest), ...Object.keys(newManifest)])].sort();
const changed = names.filter((name) => {
	const oldEntry = oldManifest[name];
	const newEntry = newManifest[name];
	if (oldEntry?.ref !== newEntry?.ref) return true;

	const before = oldCounts.get(name) ?? new Map<string, number>();
	const after = newCounts.get(name) ?? new Map<string, number>();
	const keys = moduleKeys(before, after);
	if (keys.length === 0) return false;
	return keys.some((key) => (before.get(key) ?? 0) !== (after.get(key) ?? 0));
});

const lines: string[] = [];
lines.push('Content sync generated by `.github/workflows/sync-content.yml`.');
lines.push('');
lines.push(
	'Only paths under `content/` are included. The workflow fails before opening a PR if the sync writes anywhere else.'
);
lines.push('');

if (changed.length === 0) {
	lines.push('No content changes were detected.');
} else {
	for (const name of changed) {
		lines.push(
			...renderPack(
				name,
				oldManifest[name],
				newManifest[name],
				oldCounts.get(name) ?? new Map<string, number>(),
				newCounts.get(name) ?? new Map<string, number>()
			)
		);
	}
	lines.push('Review the manifest diff and the synced content, then merge to publish the new pin.');
}

lines.push('');
lines.push('<!-- content-sync -->');
process.stdout.write(`${lines.join('\n')}\n`);
