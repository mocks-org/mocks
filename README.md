# Mocks

An unofficial, non-commercial, free practice-exam app for multiple choice based exams/quizs, built with SvelteKit and deployed to Cloudflare Workers. Exams live in separately versioned **content packs**, so a fork can add or replace content without touching app code. The look lives in `src/theme/`, so a fork can restyle without blocking app updates.

> Mocks is independent and non-commercial. All certification names and trademarks are property of their respective owners. Scores are practice feedback does not constitute, official results.

---

[![Sync content](https://github.com/mocks-org/mocks/actions/workflows/sync-content.yml/badge.svg)](https://github.com/mocks-org/mocks/actions/workflows/sync-content.yml) [![PR gate](https://github.com/mocks-org/mocks/actions/workflows/pr-gate.yml/badge.svg?branch=main&event=pull_request)](https://github.com/mocks-org/mocks/actions/workflows/pr-gate.yml)

## Requirements

- Node 26
- pnpm 12
- A Cloudflare account (only for deployment)

## Documentation

- [Content packs](docs/content-packs.md) — manifest, pack layout, allowlist, schema versions
- [Make it your own](docs/fork-your-own.md) — the edit surface, rebranding, browser-editable manifest
- [Upgrading a fork](docs/upgrading.md) — merge rules and theme patches for repositories tracking upstream
- [Authoring questions](docs/authoring.md) — question shape, options, references, review
- [Deploy to Cloudflare](docs/deploy.md) — D1 setup, migrations, seeding, Actions

## Create your copy

This is a normal repository, not a one-off template. **Fork** it, or **clone** it
and point `origin` at your own remote. Either way your copy shares history with
`mocks-org/mocks`, so `git merge upstream/main` brings accessibility and logic
fixes while your skin in `src/theme/` stays yours.

```sh
# after forking on GitHub
git clone git@github.com:<you>/mocks.git
cd mocks
git remote add upstream https://github.com/mocks-org/mocks.git
pnpm install
```

If you clone upstream directly and push to a new remote, `origin` already points
at `mocks-org/mocks`; merge `origin/main` instead of `upstream/main`.

1. `pnpm wrangler:init`, rename the worker in `wrangler.jsonc`, then
   `pnpm exec wrangler d1 create <database-name>` and paste the printed id into
   `wrangler.jsonc`.
2. `pnpm db:migrate:local`.
3. Seed the bundled demo with `pnpm db:seed:demo:local`. The repository ships no
   exam content beyond the demo, so `content/packs.json` starts empty. Install a
   real pack with `pnpm content:add github:<org>/<pack> --ref <sha>`, then run
   `pnpm bank:seed:local`. See [content packs](docs/content-packs.md).
4. Edit `src/theme/` for the look, and `src/lib/settings/site.ts` plus the `.svx`
   pages for the content (see [make it your own](docs/fork-your-own.md)).
5. Deploy (see [Deploy](#deploy)), enable Actions in the repository settings, then
   run **Actions → Sync content → Run workflow** once to confirm the pull-request
   flow.

Keeping up to date is a normal merge:

```sh
git fetch upstream
git merge upstream/main     # resolve src/theme conflicts in your favour
```

The rules — what to take from upstream, what never to take, and how the lockfile
and migrations are handled — are in
[keep it updated](docs/fork-your-own.md#5-keep-it-updated).

## Quick start

```sh
pnpm install
pnpm wrangler:init          # copy wrangler.example.jsonc -> wrangler.jsonc
pnpm db:migrate:local
pnpm db:seed:demo:local     # bundled demo exam, used by the a11y gate
pnpm dev
```

The demo exam renders at `/portal/cpacc-demo`. The homepage prefers
`site.featuredExam` and falls back to the first published exam, so it works with
the demo pack alone.

## Content packs

A pack is one exam directory shaped like `content/<exam>`:

```
exam.json
exam/
├── bank.json
└── questions/<module>/*.json
practice/
├── bank.json
└── questions/<module>/*.json
LICENSE
README.md
CONTRIBUTING.md
```

`content:add` pins each installed pack in `content/packs.json` to a full commit
SHA. The repository ships an empty manifest; an installed pack looks like this:

```json
{
	"cpacc": {
		"source": "https://github.com/mocks-org/mocks-cpacc",
		"ref": "bde1b60cf1ba5f04c5cfb51f0b6e2d2d24870f24"
	}
}
```

Add, update, remove, and inspect packs from this repository. It ships
`content/packs.json` as `{}`, so the first `content:add` creates the entry:

```sh
pnpm content:add github:mocks-org/mocks-cpacc --ref <sha>
pnpm content:list
pnpm content:update cpacc
pnpm content:remove cpacc
pnpm content:check      # manifest, directories, and schema versions agree
```

A sync only writes under `content/`, it never touches `src/`, `package.json`, or configs. Packs are validated in a temporary clone before anything is copied, and only an allowlisted set of files is accepted. The app supports schema version N and N-1.

The same update is available in CI: **Actions → Sync content → Run workflow**
(optionally choosing one pack and/or a ref). It validates the result and opens a
pull request with the old → new refs and the per-module question delta; it never
pushes to `main`. The workflow is manual-only, because GitHub silently disables
scheduled workflows after about 60 days of repository inactivity.

The bundled `content/demo` pack is not in the manifest and is never synced. It
keeps `pnpm dev` and the accessibility CI job working without a network fetch.

See [content packs](docs/content-packs.md) for the manifest rules, the full
allowlist, the schema-version contract, and how to publish a pack of your own.

## Authoring

Question shape, references, option rules, markdown, and the review workflow are
documented in [authoring](docs/authoring.md).

- The `/author` route is a client-only editor. It keeps drafts in `localStorage` and exports question or bank JSON.
- Commit exported content to a pack repository, not to a synced `content/<exam>/` directory.
- From the pack repository, validate with the app's tooling:

  ```sh
  node ../mocks/scripts/bank/validate.ts .
  node ../mocks/scripts/bank/length-audit.ts .
  node ../mocks/scripts/bank/link-check.ts .      # network
  ```

- The pack repository's CI runs the first two on every pull request and the link check weekly, against a pinned app commit. `link-check` fails on 404/410 or a dead host; timeouts are retried and only warn, so a blocked runner cannot fail the weekly job.

- Release the pack with a tag (`v0.1.0`, …), then run `pnpm content:update <exam>` in your app repository. The manifest diff is the release record.

## What to edit in your copy

A fork owner should only need:

| Path                       | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `src/theme/**`             | palette, fonts, header, footer, homepage and exam-bar layout              |
| `src/lib/settings/site.ts` | name, logo, metadata, nav, footer, homepage copy, licences, featured exam |
| `src/routes/(site)/*.svx`  | about and accessibility prose                                             |
| `content/packs.json`       | which packs are installed, pinned by SHA                                  |
| `wrangler.jsonc`           | worker name and D1 database name/id                                       |

Look changes stay in `src/theme/` (`tokens.css`, `Header.svelte`, `Footer.svelte`,
`Home.svelte`, `SessionHeader.svelte`); `pnpm theme:check` refuses accessibility
semantics there so fixes in `src/lib/` keep merging cleanly. Rebranding is a
single-file change: edit `name`, `tagline`, `description`, `url` (your deployed
origin, used for canonical URLs), `locale`, `featuredExam`, the link lists, and
`social` in `site.ts`. The header, footer, document head, homepage, and authoring
defaults all read from it. Then replace the prose in the `.svx` pages.

Everything else is app code. If that list grows, treat it as a bug in the upstream app, not as documentation to add.

[Make it your own](docs/fork-your-own.md) walks through the same surface step by
step, including editing `content/packs.json` in the browser.

## Commands

| Command                   | What it does                                             |
| ------------------------- | -------------------------------------------------------- |
| `pnpm dev`                | Vite dev server                                          |
| `pnpm build`              | generate worker types, strip globals, build              |
| `pnpm preview`            | run the built worker locally on port 4173                |
| `pnpm check`              | svelte-check with warnings as errors, plus `theme:check` |
| `pnpm theme:check`        | reject aria/role/landmark markup in `src/theme/`         |
| `pnpm lint`               | Prettier check + ESLint                                  |
| `pnpm test:unit`          | Vitest                                                   |
| `pnpm test:e2e`           | Playwright (builds and previews)                         |
| `pnpm test:a11y`          | axe scans at 320px and 1280px                            |
| `pnpm bank:validate`      | validate the demo and every pinned pack                  |
| `pnpm bank:build`         | write `build/bank/<bank>.json` and `.sql`                |
| `pnpm bank:seed:local`    | build and apply SQL to local D1                          |
| `pnpm content:add`        | fetch, validate, install a pack, write the manifest      |
| `pnpm content:update`     | move a pack to a newer commit                            |
| `pnpm content:list`       | show pinned packs and question counts                    |
| `pnpm db:migrate:local`   | apply Drizzle migrations                                 |
| `pnpm db:seed:demo:local` | seed the bundled demo exam                               |

## Deploy

See [deploy](docs/deploy.md) for the full walkthrough. In short:

1. `pnpm wrangler:init`, then set the worker name in `wrangler.jsonc`.
2. `pnpm exec wrangler d1 create <database-name>` and paste the id into `wrangler.jsonc`.
3. `pnpm db:migrate:remote`.
4. `pnpm bank:seed:remote --exam <exam>` for each pack you want live (not the demo).
5. `pnpm build`, then `pnpm exec wrangler deploy`.

Keep `wrangler.jsonc` out of git; it carries your account-specific database id. `wrangler.example.jsonc` is the committed example.

## Licence

- App code: MIT (`LICENSE`).
- Question content: the licence declared by each pack. The CPACC Mocks pack uses [CC BY-SA 4.0](https://github.com/mocks-org/mocks-cpacc/blob/main/LICENSE).

This repository is the upstream app. Fork or clone it, keep `src/theme/` as your
own skin, and merge `upstream/main` for fixes.
