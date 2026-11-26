# Accessibility

This document describes the **upstream codebase**. The core components, the theme contract, the CI gate, and the documentation. It is **not** a conformance statement for any deployment.

This repo is a template for the Mocks App. A fork owns its theme, copy, content packs, domain, and Cloudflare account. A statement in this repository would be inherited by every fork and could become false the moment someone changes a palette or a page. For that reason, the `/accessibility` route upstream is intentionally a placeholder.

**The statement for a deployment belongs to its operator.** The official Mocks instance at [mocks.oxypteros.com](https://mocks.oxypteros.com/accessibility) publishes its own. If you deploy Mocks, write one that apply to your case, do not point at this file as if it were one.

## Target

The core aims at **WCAG 2.2 Level AA**. Automated checks are evidence toward that aim, not proof of conformance.

Conformance is a property of a rendered site with a particular theme, copy, and content, so it can only be claimed per deployment.

## What the code provides

| Guarantee                                                                                                          | Where it is enforced                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Landmarks, labelled navigation, and a skip link come from core shells, so a theme cannot drop them by accident     | `src/lib/components/layout/`, composed by `src/theme/Header.svelte` and the session header |
| Accessible names, roles, focus targets, and landmarks stay out of the fork-owned theme                             | `pnpm theme:check`, part of `pnpm check` and the PR gate                                   |
| Question content is parsed into text runs and rendered without `{@html}` (raw HTML stays literal text)             | `src/lib/utils/markdown-text.ts`                                                           |
| Reference URLs become links only when they start with `http://` or `https://`                                      | The player and the results list                                                            |
| Focus moves to the feedback after an answer, and back to the prompt on retry (in the homepage sample widget)       | `SiteSampleQuestion.svelte`                                                                |
| Five routes are scanned with axe at 320px and 1280px, with WCAG A/AA, the AAA rules axe defines, and best practice | `e2e/a11y.e2e.ts`, run by `pnpm test:a11y` in the PR gate                                  |
| Contrast is a required axe rule at both widths, an `incomplete` result is annotated for review rather than ignored | `e2e/a11y.e2e.ts`                                                                          |
| Type and template warnings fail `pnpm check`                                                                       | `svelte-check --fail-on-warnings` in `pnpm check`                                          |

Question-level rules, as plain language, no option-number references, no colour-only meaning, belong to each pack.

## How it is checked

- **PR gate:** `pnpm check` (Svelte check with warnings as errors, plus `theme:check`), `pnpm lint`, `pnpm content:check`, `pnpm bank:validate`, and the axe suite.
- **Manual, outside the gate:** keyboard-only use of the lobby, attempt, practice, results, and authoring tool, screen-reader passes on the same routes, 200% and 400% zoom, forced-colors mode, reduced motion. A change that touches any of those needs a hand test before it merges, because axe will not catch it.
- **Not automated:** everything axe cannot decide, and anything that needs a person.

## Known limitations

- **Axe is a subset.** A green run means "no machine-detectable violations". The test file says so itself, and it does not replace manual keyboard, screen-reader, zoom, forced-colors, and reduced-motion checks.
- **Five routes, not every state.** The scan covers home, about, the accessibility placeholder, the exam lobby, and the authoring tool. An attempt in progress, the results list, and the practice summary are not scanned.
- **Demo content only.** The gate seeds the ten-question demo. A real pack's wording and structure are the pack's responsibility.
- **No scheduled manual audit.** Manual checks happen when a change needs them, not on a fixed cadence, and there is no testing with disabled participants upstream.
- **A fork can regress anything.** Palette, type scale, copy, and layout live in the fork. A fork's contrast ratio is not covered by the upstream gate.
- **Reduced-motion coverage is partial.** Some transitions check the preference, the results filters do not.
- **No formal conformance claim.** This document does not say "Mocks is WCAG 2.2 AA conformant", because the template is not a site.

## For fork owners

1. Keep semantics in `src/lib/`. Do not add `aria-*`, `role`, `tabindex`, or landmark elements to `src/theme/`, `theme:check` will fail, and the fix would not merge cleanly.
2. Run `pnpm check` and `pnpm test:a11y` before you deploy, and re-run them after a theme change.
3. Replace `src/routes/(site)/accessibility/+page.svx` with your own statement. Say what you tested, how, and what you did not.
4. If you distribute the app or the content, publish a VPAT/ACR for your deployment.
5. Report a core bug upstream so the fix reaches every fork.

[Make it your own](../docs/fork-your-own.md) covers the theme seam and the files you own.

## Reporting

- **App interface or core components:** open an issue in [mocks-org/mocks](https://github.com/mocks-org/mocks/issues). Say which route, browser, and assistive technology.
- **A question's wording or structure:** report it in [mocks-org/mocks-cpacc](https://github.com/mocks-org/mocks-cpacc/issues).
- **A security problem:** use [SECURITY.md](SECURITY.md), not a public issue.

## Review

- This document is reviewed when the theme contract or the axe gate changes, and at least once a year.
- Last reviewed: 2026-11-26.

## References

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C WAI: Writing for web accessibility](https://www.w3.org/WAI/tips/writing/)
- [W3C WAI: WCAG 2 overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Authoring Tool Accessibility Guidelines (ATAG) 2.0](https://www.w3.org/TR/ATAG20/), a reference for the `/author` editor, not a conformance claim

This document is part of the app repository and is licensed under [MIT](../LICENSE).
