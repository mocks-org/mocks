import { relative, resolve } from 'node:path';
import { hasErrors } from '../../src/lib/authoring/schema.ts';
import { isPackRoot, loadAllPacks, loadPackDir } from '../content/packs.ts';
import { loadBankSource, printIssues, printSummary, repoRoot, type BankSource } from './source.ts';

/**
 * Validate one bank, one pack, or every pack.
 *
 *   node scripts/bank/validate.ts                       every pack + demo
 *   node scripts/bank/validate.ts content/cpacc         one pack
 *   node scripts/bank/validate.ts content/cpacc/exam    one bank (authoring)
 */

const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
let failed = false;
let issueCount = 0;

function report(source: BankSource): void {
	printSummary(source);
	printIssues(source.issues);
	issueCount += source.issues.length;
	if (hasErrors(source.issues)) failed = true;
}

try {
	if (rootArgument) {
		const root = resolve(rootArgument);
		if (isPackRoot(root)) {
			const pack = loadPackDir(root);
			console.log(`Pack: ${pack.name} (${root})`);
			for (const bank of pack.banks) report(bank);
		} else {
			report(loadBankSource(root));
		}
	} else {
		const packs = loadAllPacks();
		for (const pack of packs) {
			console.log(`\nPack: ${pack.name} (${relative(repoRoot, pack.dir)})`);
			for (const bank of pack.banks) report(bank);
		}
		console.log(`\nValidated ${packs.length} pack(s).`);
	}
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}

if (failed) {
	process.exit(1);
}

if (issueCount === 0) {
	console.log('\nNo content issues.');
}
