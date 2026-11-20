/**
 * Theme boundary guard.
 *
 * `src/theme/**` is fork-owned: layout, spacing, type scale and arrangement.
 * Accessibility semantics — accessible names, roles, focus targets and
 * landmarks — live in `#lib` components instead, so an upstream fix reaches
 * every fork even when the fork has restyled or rearranged the skin.
 *
 * This check fails when a theme file starts carrying those semantics itself.
 * `aria-labelledby` is allowed because it can only point at an id in the same
 * file and cannot encode a contract upstream needs to change.
 *
 * Run: `pnpm theme:check` (also part of `pnpm check`).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const themeDir = join(root, 'src/theme');

type Rule = { label: string; pattern: RegExp };

const RULES: Rule[] = [
	{ label: 'aria attribute', pattern: /\baria-(?!labelledby)[a-z-]+=/ },
	{ label: 'role attribute', pattern: /\brole=/ },
	{ label: 'tabindex attribute', pattern: /\btabindex=/ },
	{ label: 'landmark element', pattern: /<\/?(?:nav|main|header|footer)\b/i }
];

function* svelteFiles(dir: string): Generator<string> {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			yield* svelteFiles(full);
		} else if (entry.endsWith('.svelte')) {
			yield full;
		}
	}
}

if (!existsSync(themeDir)) {
	console.log('theme:check skipped: src/theme does not exist.');
	process.exit(0);
}

let files = 0;
let failures = 0;

for (const file of svelteFiles(themeDir)) {
	files += 1;
	const lines = readFileSync(file, 'utf8').split('\n');

	for (const [index, line] of lines.entries()) {
		for (const rule of RULES) {
			const match = rule.pattern.exec(line);
			if (!match) continue;

			console.error(`${relative(root, file)}:${index + 1}  ${rule.label} — "${match[0].trim()}"`);
			failures += 1;
		}
	}
}

if (failures > 0) {
	console.error(
		`\ntheme:check failed: ${failures} semantic marker(s) across ${files} theme file(s).`
	);
	console.error('Move them into a #lib component so accessibility fixes reach every fork.');
	console.error('See docs/fork-your-own.md ("Skin vs core").');
	process.exit(1);
}

console.log(
	`theme:check passed: ${files} theme file(s) carry no aria/role/tabindex/landmark markup.`
);
