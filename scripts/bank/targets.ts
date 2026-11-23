import { resolve } from 'node:path';
import { isPackRoot, loadAllPacks, loadPackDir } from '../content/packs.ts';
import { loadBankSource, type BankSource } from './source.ts';

/**
 * Resolve the CLI target list.
 *
 * - no argument: every bank in every loaded pack (including the demo)
 * - pack root: every bank in that pack
 * - bank root: just that bank (authoring / pack CI)
 */
export function loadTargets(
	rootArgument: string | undefined,
	options: { requireQuestions?: boolean } = {}
): BankSource[] {
	if (rootArgument) {
		const root = resolve(rootArgument);
		if (isPackRoot(root)) return loadPackDir(root, options).banks;
		return [loadBankSource(root, options)];
	}

	return loadAllPacks(options).flatMap((pack) => pack.banks);
}
