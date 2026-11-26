import { describe, expect, it } from 'vitest';
import { spokenTitle } from './spoken-title';

describe('spokenTitle', () => {
	it('spells an initialism', () => {
		expect(spokenTitle('CPACC')).toBe('C P A C C');
	});

	it('spells an initialism inside a title', () => {
		expect(spokenTitle('CPACC Demo (test data)')).toBe('C P A C C Demo (test data)');
	});

	it('leaves a title without initialisms alone', () => {
		expect(spokenTitle('Certified Professional')).toBe('Certified Professional');
	});

	it('uses an override for an initialism that is read as a word', () => {
		expect(spokenTitle('LEED Green Associate', { LEED: 'leed' })).toBe('leed Green Associate');
	});
});
