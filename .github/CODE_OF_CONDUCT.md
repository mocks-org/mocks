# Code of conduct

This is the app repository. It holds the SvelteKit code, the theme seam, the scripts, the docs, and a ten-question demo. The question bank is a separate repository, [mocks-org/mocks-cpacc](https://github.com/mocks-org/mocks-cpacc), and its [code of conduct](https://github.com/mocks-org/mocks-cpacc/blob/main/CODE_OF_CONDUCT.md) governs question wording.

## Scope

- Issues, pull requests, code review, discussions, commit messages, and pull request descriptions in this repository.
- The documentation under `docs/`, the demo pack in `content/demo/`, the UI copy in `src/lib/settings/site.ts`, and the authoring tool's strings.
- Any space where you are representing the project.

## Our commitments

1. **Review the change, not the contributor.** A bad patch is not a bad person.
2. **Assume good faith, then ask.** Most disagreements are about context, not intent.
3. **Make it safe to be wrong.** A correction is not an attack, and changing your mind is normal.
4. **Keep the project usable by disabled contributors.** Write issues in text, not screenshots alone. Do not require a disclosure of disability, identity, or pronouns to justify a change.

## Expected behaviour

- Say what is wrong and why. "This breaks the focus order on the results page" is reviewable. "This is bad" is not.
- Separate a blocker from a nit. A missing accessible name blocks a merge, a comma does not.
- Respect the names and pronouns people use, in review comments and in commit credits.
- No harassment, slurs, threats, sexual attention, doxxing, or sustained disruption.
- No bigotry presented as a technical argument, and no "just asking questions" used to wear someone down.
- Do not demand unpaid work or a timeline. Maintainers are volunteers, and "no" or "not now" is a complete answer.
- Credit contributors in the pull request and the commit credit.

## Language in the app

The app writes UI strings, error messages, docs, demo questions, and issue templates. They follow the same principles as the question bank:

- People first by default, identity-first where a community prefers it.
- Describe the barrier, not the deficit.
- No disability as metaphor or insult (`blind to`, `tone-deaf`, `crazy`, `lame`).
- No outdated or dehumanising terms.

The term table and the worked examples are in the [pack's code of conduct](https://github.com/mocks-org/mocks-cpacc/blob/main/CODE_OF_CONDUCT.md#12-words-we-avoid). A wording fix in a review is a normal suggestion, not a judgement of the author.

## Reporting and enforcement

Report a conduct problem privately. Direct-message a maintainer on GitHub, or use [GitHub's report abuse form](https://github.com/contact/report-abuse) when the behaviour happens on the platform. Do not open a public issue that names a person.

Maintainers will:

1. Acknowledge the report within five working days.
2. Keep the report and the reporter's identity confidential.
3. Recuse anyone involved from the decision.
4. Choose a response proportional to the problem, a private word, a required edit, removal of a comment, or a temporary or permanent ban.
5. Explain the decision to the reporter and to the person concerned.

An appeal goes to a maintainer who was not part of the decision. Retaliation against a reporter or a witness is itself a violation.

Security problems have their own private route: [SECURITY.md](SECURITY.md). Do not use this section for a payload or a live malicious link.

## For maintainers

- Apply this document to your own changes first.
- Do not merge a change that violates the language rules, even when the code is correct.
- Record the reason for a decision in the pull request, so the next reviewer does not relitigate it.
- Do not ask a contributor to explain or prove their identity to justify an accessibility fix.

## Changes to this document

Pull requests are welcome. Say which rule or example the change affects, and cite a current source when the change is about a term.

The structure follows the [Contributor Covenant, version 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). This document is licensed under the same terms as the rest of the app ([MIT](../LICENSE)).
