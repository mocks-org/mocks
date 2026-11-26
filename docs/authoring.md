# Authoring questions

Questions are authored in a **content-pack repository**, not in this app. The app owns the schema and the validator. A pack owns the exam configuration, its banks, and its questions. The one exception is the bundled `content/demo` pack, which is test data for development and CI.

If you have not created a pack yet, start with [content packs](./content-packs.md). This page describes what goes inside a question and how a bank is reviewed.

## Where a question lives

```
<pack>/<kind>/bank.json
<pack>/<kind>/questions/<module>/<question-id>.json
```

Each question is one JSON file, named by its ID, in the directory of its module. Do not write a full-bank JSON file or SQL into a pack, `pnpm bank:build` generates those in the app.

`<kind>` is `exam` for the scored bank and `practice` for untimed learning questions. A pack may contain only an exam bank, only a practice bank, or both.

## The question shape

```json
{
	"id": "cpacc-exam-standards-0042",
	"module": "standards",
	"type": "single",
	"stem": "Which WCAG 2.2 success criterion requires a visible focus indicator?",
	"options": [
		{
			"id": "a",
			"text": "Focus Visible",
			"shortLabel": "Focus Visible",
			"rationale": "This is the criterion that covers the keyboard focus indicator."
		},
		{
			"id": "b",
			"text": "Contrast (Minimum)",
			"shortLabel": "Contrast",
			"rationale": "It sets text and background contrast, not the focus indicator."
		},
		{
			"id": "c",
			"text": "Target Size (Minimum)",
			"shortLabel": "Target Size",
			"rationale": "It sets pointer target size, not the visibility of focus."
		},
		{
			"id": "d",
			"text": "Reflow",
			"shortLabel": "Reflow",
			"rationale": "It covers horizontal scrolling at narrow widths, not focus."
		}
	],
	"correctOptionId": "a",
	"explanation": "Focus must remain perceivable for keyboard users. The other criteria address contrast, target size, and reflow.",
	"references": [
		{
			"kind": "web",
			"title": "Understanding Success Criterion 2.4.7: Focus Visible",
			"url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
		}
	],
	"images": [],
	"difficulty": 2,
	"tags": ["wcag", "keyboard"],
	"status": "published",
	"provenance": "authored",
	"author": "contributor-handle",
	"reviewer": "reviewer-handle",
	"reviewedAt": "2026-11-20",
	"sourceCheckedAt": "2026-11-20"
}
```

| Field             | Notes                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `id`              | Stable, ends in four digits, starts with the exam slug. The filename must equal it.        |
| `module`          | Must be a module declared in the bank's `bank.json`.                                       |
| `type`            | Always `single` in v0.                                                                     |
| `stem`            | The question text. May use the Markdown subset below.                                      |
| `options`         | At least two, exactly one correct. Each needs `id`, `text`, `shortLabel`, and `rationale`. |
| `correctOptionId` | Binds correctness to an option ID, never to a position or label.                           |
| `explanation`     | The shared lesson, shown after answering. Must not hard-code option numbers.               |
| `references`      | At least one, see below.                                                                   |
| `images`          | Must stay `[]` in v0.                                                                      |
| `difficulty`      | 1–5 self-assessment for balance, not scoring.                                              |
| `tags`            | Free-form topic labels for review and future drills.                                       |
| `status`          | `draft`, `review`, `published`, or `retired`.                                              |
| `provenance`      | `authored` or `llm_assisted`.                                                              |
| `author`          | Public credit for the writer, separate from the reviewer. Optional.                        |
| `reviewer`        | Name or handle (required once published).                                                  |
| `reviewedAt`      | `YYYY-MM-DD` (required once published).                                                    |
| `sourceCheckedAt` | `YYYY-MM-DD`, the date the citation was last verified (required once published).           |

Option IDs only need to be unique within their question. The stored order is authoring order, the player shuffles options per attempt and derives labels from the displayed order. Never store a label, letter, or position.

A published bank may contain only published questions and no empty files. In a draft bank, a zero-byte question file is treated as a placeholder rather than a question. It is counted in the validator summary, and it blocks publishing.

## References

| `kind`        | Required                                            | Use for                                                       |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `web`         | `title`, public `https://` or `http://` `url`       | A page, online report, or standard                            |
| `publication` | `title`, `author` (or publisher), four-digit `year` | A book, article, standard, or report, `url` is optional       |
| `general`     | `title`, `note`                                     | Widely established background, with the warrant in the `note` |

Use `general` only when the claim survives without a single source. If a named document defines, requires, measures, or reports the claim (a threshold, treaty definition, statistic, date, or attributed finding) use `web` or `publication`. Each reference URL may appear only once in a question.

Cite primary sources, and make the citation actually support the answer. "See the Body of Knowledge" is not enough. Point at the relevant section. If a source disappears, replace it or retire the question.

## Sourcing and originality

- Write stems, options, rationales, and explanations in original wording. Facts are not copyrightable. Expression is! Do not paste passages, tables, or figures without permission.
- Do not reproduce real or leaked exam items, or paid course content, and do not imply access to the provider's item bank.
- Name the jurisdiction and version for legal or standards claims, and do not imply legal advice.
- By contributing, you license your questions under the pack's licence.

## Options and distractors

- Exam banks use exactly `bank.optionCount` options per question (CPACC uses four). Practice questions may use two or more, validated per question.
- Exactly one option is correct. The others must be **same-subject, false, and peer-shaped**. A claim from the same model, standard, or mechanism, false for a reason written in its `rationale`, and in the same grammatical shape as the correct option.
- Do not let topic, absolutes ("all", "always", "never", "only", "must"), or wording from the stem eliminate a distractor. Avoid "all of the above" and "none of the above".
- Do not force options to a common length. Length **must not** encode correctness. Within a question options vary because the claims need different qualification, and across a module the correct option is longest, middle, and shortest with roughly equal frequency (aim for 15–35% each, no run of more than three). Padding or trimming an option to hit a length creates its own tell, rewrite the claim instead.
- Never refer to option numbers in `explanation` (order is shuffled).

`pnpm bank:length-audit` reports the correct answer's length rank per question, the per-module distribution, absolute-word findings, and runs. It is advisory by default (`--strict` makes it fail on findings).

## Markdown

`stem`, option `text`, `explanation`, and option `rationale` render a deliberately
small Markdown subset:

- fenced code blocks (``` or `~~~`, optional info string)
- inline code
- `**strong**` / `__strong__`
- `*emphasis*` / `_emphasis_`

Links, images, headings, lists, tables, and raw HTML are shown as plain text. Do not use them. `shortLabel` and reference text stay plain, they are one-line labels, not prose.

## Writing for accessibility

- Use plain language and short sentences. Expand acronyms on first use.
- One idea per question. Avoid double negatives, "except" chains, and idioms.
- Keep the answer independent of colour, position, shape, or a purely visual detail.
- Stems and options must read linearly for a screen reader.
- Avoid unexplained jargon and cultural references.
- Use inclusive, people-first language. Avoid outdated, dehumanising, or disability-as-metaphor wording. A pack may publish its own code of conduct with the term list. The [CPACC pack's](https://github.com/mocks-org/mocks-cpacc/blob/main/CODE_OF_CONDUCT.md) is the reference implementation.
- A pack may publish an accessibility statement for its content, separate from the app's own statement. The [CPACC pack's](https://github.com/mocks-org/mocks-cpacc/blob/main/ACCESSIBILITY.md) is the reference implementation.

## Bank-level rules

`bank.json` and `exam.json` are shared by the whole pack:

- `schemaVersion` versions the authoring contract. The app supports N and N-1 (currently 3 and 2). Do not hand-edit it to match an older validator, upgrade the pack instead.
- `bank.version` versions the published question set. Bump it in the release commit, not on every draft edit.
- `exam.json.blueprintVersion` records the blueprint or Body of Knowledge edition the bank targets. The results page shows the bank and blueprint versions an attempt started with.
- Exam module `questionCount` values sum to `exam.json.questionCount`, and `bank.optionCount` equals `exam.optionCount`.
- Publish the exam before publishing its bank. A published bank requires every question to be published.
- Retire questions instead of deleting them when an ID might be referenced elsewhere, a retired question is excluded from future draws.

The validator also rejects the same question content twice in one bank, even under different IDs, and rejects any `TODO` placeholder.

## Review workflow

1. **Draft** -- the author writes the question and its citations.
2. **Automated checks** -- schema, ID uniqueness, option count, exactly one correct
   option, references, duplicate content, placeholders.
3. **Content review** -- a second person checks the answer against the cited source, the explanation and every rationale, distractor quality, wording, and bias. A pack may add its own admission rule. The CPACC pack requires a topic to appear in both the Body of Knowledge and the exam content outline.
4. **Accessibility review** -- linear reading, no colour-only meaning, plain language, alt text when images arrive.
5. **Publish** -- set `status` to `published`, `reviewer`, `reviewedAt`, and `sourceCheckedAt`, and bump `bank.version` for the release.
6. **Correction** -- edit a published question through the same path. Results and attempts are ephemeral in v0, so a correction affects the next attempt, there is no stored past attempt to rewrite.

Contributions arrive as pull requests. A binary database file cannot be reviewed in a diff, which is why the source stays one JSON file per question and the aggregate is generated.

## LLM-assisted authoring

Allowed, with conditions:

1. A human author owns the question and is accountable for it.
2. The question is fact-checked against the cited source, not against the model.
3. Wording is edited for clarity and originality, no near-copy of source text.
4. It passes the same review as fully human-authored content.
5. Provenance is recorded as `llm_assisted`, with reviewer and dates.
6. Model output is never imported into D1 without review.

## Validate

From a pack root, using a checkout of the app next to it:

```sh
node ../mocks/scripts/bank/validate.ts .  # errors fail, warnings do not
node ../mocks/scripts/bank/length-audit.ts .  # add --strict to fail on findings
node ../mocks/scripts/bank/link-check.ts .  # network, checks reference URLs
```

`link-check` fails on a 404/410 and on a host that no longer resolves. Timeouts and 5xx answers are retried and then reported as unverified without failing, because a blocked CI runner does not prove the page is gone, pass `--strict` to fail on those as well, or `--lenient` to never fail. Run it locally before editing a reference that CI could not verify.

A pack repository should run the first two on every pull request and the link check on a schedule. See the CPACC pack's [workflow](https://github.com/mocks-org/mocks-cpacc/blob/main/.github/workflows/validate.yml).

The `/author` route is a client-only editor for the same shape: it keeps drafts in `localStorage` and exports question or bank JSON. Copy the exported files into a pack repository, then validate there. Nothing on `/author` is sent to the server, and nothing it exports should be written into a synced `content/<exam>/` directory.
