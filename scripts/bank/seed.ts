import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { hasErrors } from '../../src/lib/authoring/schema.ts';
import { writeBankArtifacts } from './artifacts.ts';
import { printIssues, printSummary, repoRoot } from './source.ts';
import { loadTargets } from './targets.ts';

/**
 * Build and apply the D1 seed for one bank, one pack, or every pack.
 *
 *   node scripts/bank/seed.ts --local                    every pack + demo
 *   node scripts/bank/seed.ts --local --exam cpacc       one exam
 *   node scripts/bank/seed.ts --local content/demo       one pack
 *   node scripts/bank/seed.ts --local content/demo/exam  one bank
 */

const args = process.argv.slice(2);
const targets = args.filter((argument) => argument === '--local' || argument === '--remote');
if (targets.length > 1) {
	console.error('Choose one of --local or --remote, not both.');
	process.exit(1);
}

const target = targets[0] === '--remote' ? 'remote' : 'local';
const dryRun = args.includes('--dry-run');

let examFilter: string | undefined;
const positionals: string[] = [];
for (let index = 0; index < args.length; index += 1) {
	const argument = args[index];
	if (argument === '--local' || argument === '--remote' || argument === '--dry-run') continue;
	if (argument === '--exam') {
		examFilter = args[index + 1];
		index += 1;
		if (!examFilter) {
			console.error('--exam needs an exam slug.');
			process.exit(1);
		}
		continue;
	}
	if (argument.startsWith('--exam=')) {
		examFilter = argument.slice('--exam='.length);
		continue;
	}
	if (argument.startsWith('--')) continue;
	positionals.push(argument);
}

const rootArgument = positionals[0];

let sources;
try {
	sources = loadTargets(rootArgument, { requireQuestions: true });
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}

if (examFilter) {
	sources = sources.filter((source) => source.exam.slug === examFilter);
	if (sources.length === 0) {
		console.error(`No loaded bank belongs to the "${examFilter}" exam.`);
		process.exit(1);
	}
}

let failed = false;
for (const source of sources) {
	printSummary(source);
	printIssues(source.issues);
	if (hasErrors(source.issues)) failed = true;
}

if (failed) {
	process.exit(1);
}

const database = readDatabaseName();
const artifacts: { sqlPath: string; bank: string }[] = [];

try {
	for (const source of sources) {
		const written = writeBankArtifacts(source);
		console.log(`Wrote ${relative(repoRoot, written.sqlPath)}`);
		artifacts.push({ sqlPath: written.sqlPath, bank: source.bank.id });
	}
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}

if (dryRun) {
	console.log('Dry run: the SQL was generated but not applied.');
	process.exit(0);
}

console.log(`Seeding ${sources.length} bank(s) into the ${target} D1 database (${database})...`);

for (const artifact of artifacts) {
	const result = spawnSync(
		'pnpm',
		[
			'exec',
			'wrangler',
			'd1',
			'execute',
			database,
			target === 'remote' ? '--remote' : '--local',
			`--file=${artifact.sqlPath}`
		],
		{ cwd: repoRoot, stdio: 'inherit' }
	);

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}
	if (result.status !== 0) {
		console.error(`Seeding ${artifact.bank} failed.`);
		process.exit(result.status ?? 1);
	}
}

/**
 * Read `d1_databases[0].database_name` from wrangler.jsonc so a template user
 * who renames the database does not have to edit this script. Fall back to the
 * historical name when the config is missing (for example in a bare CI job).
 */
function readDatabaseName(): string {
	const file = join(repoRoot, 'wrangler.jsonc');
	if (!existsSync(file)) return 'mocks-db';

	try {
		const config = JSON.parse(stripJsonComments(readFileSync(file, 'utf8'))) as {
			d1_databases?: { database_name?: string }[];
		};
		return config.d1_databases?.[0]?.database_name?.trim() || 'mocks-db';
	} catch {
		return 'mocks-db';
	}
}

/** Strip `//` and block comments without touching `https://` inside strings. */
function stripJsonComments(input: string): string {
	let output = '';
	let inString = false;
	let escaped = false;
	let inLine = false;
	let inBlock = false;

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];
		const next = input[index + 1];

		if (inLine) {
			if (char === '\n') {
				inLine = false;
				output += char;
			}
			continue;
		}

		if (inBlock) {
			if (char === '*' && next === '/') {
				inBlock = false;
				index += 1;
			}
			continue;
		}

		if (inString) {
			output += char;
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === '"') inString = false;
			continue;
		}

		if (char === '"') {
			inString = true;
			output += char;
			continue;
		}
		if (char === '/' && next === '/') {
			inLine = true;
			index += 1;
			continue;
		}
		if (char === '/' && next === '*') {
			inBlock = true;
			index += 1;
			continue;
		}

		output += char;
	}

	// Wrangler's JSONC allows trailing commas.
	return output.replace(/,\s*([}\]])/g, '$1');
}
