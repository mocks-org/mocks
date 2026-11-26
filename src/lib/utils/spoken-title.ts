/**
 * The text a speech synthesizer should read for an exam title.
 * A synthesizer that does not know an initialism falls back to letter-to-sound
 * rules and reads it as a word (`CPACC` as "pac"), so initialisms are
 * spelled out. `overrides` supplies a different spoken form for an initialism
 * that is read as a word, for example `{ LEED: 'leed' }`.
 */
export function spokenTitle(title: string, overrides: Record<string, string> = {}): string {
	return title.replace(/\b[A-Z]{2,}\b/g, (token) => overrides[token] ?? token.split('').join(' '));
}
