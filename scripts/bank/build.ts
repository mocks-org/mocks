import { relative } from 'node:path';
import { hasErrors } from '../../src/lib/authoring/schema.ts';
import { writeBankArtifacts } from './artifacts.ts';
import { printIssues, printSummary, repoRoot } from './source.ts';
import { loadTargets } from './targets.ts';

/**
 * Build the generated JSON/SQL for one bank, one pack, or every pack.
 *
 *   node scripts/bank/build.ts                       every pack + demo
 *   node scripts/bank/build.ts content/cpacc         one pack
 *   node scripts/bank/build.ts content/cpacc/exam    one bank
 */

const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));

let sources;
try {
	sources = loadTargets(rootArgument, { requireQuestions: true });
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
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

try {
	for (const source of sources) {
		const artifacts = writeBankArtifacts(source);
		console.log(`Wrote ${relative(repoRoot, artifacts.jsonPath)}`);
		console.log(`Wrote ${relative(repoRoot, artifacts.sqlPath)}`);
	}
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}
