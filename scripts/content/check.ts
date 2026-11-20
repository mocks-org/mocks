import { BUNDLED_PACK, inspectContent } from './packs.ts';

/**
 * Manifest and layout check.
 *
 * `content/packs.json` is the only upstream-tracking file, so a pull request
 * that moves a pin must keep it honest. This command fails when:
 * - a manifest entry has no `content/<exam>/` directory,
 * - a pack directory (other than the bundled demo) has no manifest entry,
 * - the directory name, the manifest key, and `exam.json`'s slug disagree,
 * - a bank declares a `schemaVersion` this app does not support,
 * - two packs claim the same exam slug.
 *
 * It reads no question files: `pnpm bank:validate` owns the question rules, so
 * this check stays fast enough to run before them.
 *
 * Usage:
 *   node scripts/content/check.ts
 */

const { manifest, layouts, errors } = inspectContent();

if (errors.length > 0) {
	for (const error of errors) console.error(`error: ${error}`);
	console.error(`\n${errors.length} content layout error(s).`);
	process.exit(1);
}

for (const layout of layouts) {
	const banks = Object.entries(layout.schemaVersions)
		.map(([kind, version]) => `${kind}@v${version}`)
		.join(', ');
	const pin = manifest[layout.name];

	console.log(`${layout.name.padEnd(12)} ${pin ? `${pin.source} @ ${pin.ref}` : 'bundled'}`);
	console.log(`${''.padEnd(13)}content/${layout.name}/  slug ${layout.exam.slug}  banks ${banks}`);
}

const pinned = layouts.filter((layout) => layout.name !== BUNDLED_PACK).length;
const bundled = layouts.some((layout) => layout.name === BUNDLED_PACK);
console.log(
	`\n${pinned} pinned pack(s) and ${bundled ? 'the bundled demo' : 'no bundled demo'} ` +
		`agree with content/packs.json.`
);
