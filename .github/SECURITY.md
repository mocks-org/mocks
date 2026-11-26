# Security policy

Mocks is a SvelteKit app that deploys to Cloudflare Workers and reads its question banks from a D1 database.

It has **no accounts, no authentication, and no server-side attempt storage**.

An attempt lives in the browser's `sessionStorage`, authoring drafts live in `localStorage`, and D1 holds published exam and question content only.

That shapes the threat model. Most of what matters is injection through rendered content, integrity of the bank and its release, and the CI boundary.

## Supported versions

The app is supported on the `main` branch. A fork is supported at the commit it tracks, fixes land on `main` and reach a fork when its owner merges upstream.

We do not backport security fixes to old forks, and we cannot patch a deployment we do not operate.

## What counts as a vulnerability

| In scope                                                                                                                                                                                | Why it matters                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Markup or script injection through any rendered field. Question content, option text, explanations, rationales, reference titles and notes, exam and bank metadata, or an error message | Question content is untrusted. The renderer is deliberately narrow, and a bypass is a real finding. |
| A URL that escapes the `http(s)` check and becomes a clickable `javascript:`, `data:`, or similar link                                                                                  | Reference URLs become links in the player and the results list.                                     |
| SQL injection or a repository method that reads or writes outside its exam and bank in `src/lib/server/repositories`                                                                    | D1 is the only data store.                                                                          |
| Answer-key exposure. An endpoint that returns correctness or feedback before an attempt is scored, other than the practice bank that does so by design                                  | Exam integrity is the point of withholding it.                                                      |
| A write outside `content/` from `scripts/content/sync.ts`, including through a crafted pack                                                                                             | The sync runs in CI with `contents: write`, so a path escape is a supply-chain issue.               |
| A secret or token exposed in the repository, its history, or CI logs, or a workflow change that exposes secrets to a pull request from a fork                                           | Fork PRs must never receive secrets.                                                                |
| A dependency or GitHub Action that introduces a known vulnerability into a build                                                                                                        | The app ships to other people's Cloudflare accounts.                                                |
| A single request that can exhaust the Worker or the D1 database, or a code-level denial of service                                                                                      | There is no application-level rate limit.                                                           |

| Out of scope                                                                     | Where it goes                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A wrong answer, an ambiguous question, or a bad reference                        | [mocks-org/mocks-cpacc issues](https://github.com/mocks-org/mocks-cpacc/issues) |
| A deployment's own theme, copy, domain, D1 database, or Cloudflare configuration | Its operator                                                                    |
| A missing security header that a fork removed, or a fork's own dependency change | The fork                                                                        |
| Third-party sites linked from a question reference                               | Their owners. Report a malicious citation to the pack instead                   |
| Scraping the public question bank                                                | The content is public by design                                                 |
| The fact that scores are practice feedback and not official results              | By design, see the README                                                       |

If you are unsure which side a report falls on, send it privately and we will route it.

## Reporting a vulnerability

**Preferred:** open the repository's **Security** tab and choose **Report a vulnerability**. That starts a private advisory visible only to the maintainers.

If that is not possible, send a direct message to a maintainer on GitHub. Do not open a public issue with a working payload or a live malicious URL.

Include:

- the commit or branch, the route or script, and the browser or runtime
- what you expected and what happened
- a minimal reproduction, ideally against a local checkout
- whether the issue is in upstream code or only in a particular deployment
- how you would like to be credited, or that you prefer not to be

Do not test against `mocks.oxypteros.com` or any deployment you do not own. Run it locally (`pnpm wrangler:init`, `pnpm db:migrate:local`, `pnpm db:seed:demo:local`, `pnpm dev`) or in your own fork. Do not modify a live database, and do not attempt to access data that is not yours.

## What we do

1. Acknowledge the report within five working days.
2. Confirm whether the issue is in `main`, and what a deployment would need to change.
3. Prepare the fix privately when a public report would put users at risk, then publish the fix and an advisory.
4. Ship the fix on `main` and say in the advisory what fork owners should merge. A deployment changes only when its operator redeploys.
5. Credit the reporter in the advisory and the fixing pull request, unless they ask otherwise.

There is no bug bounty. Good-faith research that stays within your own checkout or deployment and does not degrade a service, access other people's data, or attack a third-party site will not be pursued by the maintainers.

## What is already in place

These are deliberate, so a report that only restates them is not a vulnerability:

- Question Markdown is parsed into text runs and rendered without `{@html}`. Raw HTML stays literal text.
- Reference URLs become links only when they start with `http://` or `https://`.
- Attempts are scored by a stateless endpoint, nothing about an attempt is stored on the server.
- The PR gate runs with `contents: read` and receives no secrets.
- `wrangler.jsonc` is not committed, the repository ships `wrangler.example.jsonc` with a placeholder D1 id.
- CI installs with `pnpm install --frozen-lockfile`.

## Known gaps

- GitHub Actions are pinned to major version tags (`actions/checkout@v7`), not to commit SHAs, so a moved tag is a supply-chain risk.
- The app does not set a Content Security Policy (CSP) or other security headers. A deployment can add them at its edge, a code-level fix is welcome.
- There is no application-level rate limiting beyond what Cloudflare provides.

## Changes to this policy

Pull requests are welcome. A change to the reporting route, the CI boundary, or the supported-version rule should also be reflected in `README.md` and `docs/deploy.md`.
