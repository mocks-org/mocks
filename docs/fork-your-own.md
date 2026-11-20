# Make it your own

This repository is a template, not a fork of an upstream app. You create a new
repository from it, edit a small set of files, and deploy it. There is no upstream
merge and nothing to rebase.

This page covers the edit surface and the rebranding steps. For Cloudflare setup
see [deploy](./deploy.md), for the pack format see
[content packs](./content-packs.md).

## The edit surface

A template user should only need these files:

| Path                       | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `src/lib/settings/site.ts` | name, logo, metadata, nav, footer, homepage copy, licences, featured exam |
| `src/routes/(site)/*.svx`  | about and accessibility prose                                             |
| `content/packs.json`       | which packs are installed, pinned by SHA                                  |
| `wrangler.jsonc`           | worker name and D1 database name/id (not committed)                       |

Everything else is app code. If you need to edit it for a routine rebrand, that is
a bug in the template, not a missing instruction.

## 1. Create your copy

1. On GitHub, choose **Use this template → Create a new repository**.
2. Clone your new repository and run `pnpm install`.
3. Create the local Wrangler config: `pnpm wrangler:init`.
4. For deployment, create a D1 database and paste its id into `wrangler.jsonc`
   (see [deploy](./deploy.md)). The placeholder id is enough for local work.
5. Apply migrations: `pnpm db:migrate:local`.

The demo pack stays in the repository. It powers the a11y CI job
and gives `/` something to render before you seed a real exam.

## 2. Rebrand

Open `src/lib/settings/site.ts` and edit the fields in place. The header, footer,
document head, homepage, and authoring defaults all read from this object, so one
change updates every occurrence.

| Field                 | What it controls                                                   |
| --------------------- | ------------------------------------------------------------------ |
| `name`                | Brand name in the header, footer, titles, and authoring tool       |
| `tagline`             | Fallback page-title phrase                                         |
| `description`         | `<meta name="description">` and Open Graph description             |
| `url`                 | Canonical and Open Graph URLs; set it to your deployed origin      |
| `locale`              | `<html lang>`                                                      |
| `featuredExam`        | Exam shown on the homepage; falls back to the first published exam |
| `logo`                | Header mark; swap the icon import at the top of the file           |
| `startYear`           | First year in the footer copyright range                           |
| `headerLinks`         | In-site header navigation                                          |
| `footerLinks`         | In-site footer navigation                                          |
| `social`              | Public profiles beside the licence links                           |
| `disclaimer`          | Independent/non-commercial statement                               |
| `unofficialStatement` | "Not affiliated…" notice shown where a score could look official   |
| `licenseLinks`        | Code and content licences in the footer and authoring tool         |
| `credit`              | Toggle for the author credit                                       |
| `home`                | Hero, sample, and practice copy and button labels                  |

`site.url` must not have a trailing slash, and it should match the origin users
actually visit, otherwise canonical links point at the wrong host.

Then replace the prose in the two `.svx` pages:

- `src/routes/(site)/about/+page.svx`
- `src/routes/(site)/accessibility/+page.svx`

These are the "replace me" set. They are ordinary Markdown with the shared mdsvex
layout; there is no component work involved.

## 3. Choose your content packs

A pack is installed by pinning it in `content/packs.json` and copying its files into
`content/<exam>/`. The CLI does both, and validates the pack first:

```sh
pnpm content:add github:<owner>/<pack>
pnpm content:list
pnpm bank:validate
pnpm bank:seed:local
```

To move an installed pack to a newer release, run `pnpm content:update <exam>`.
With no argument it updates every pinned pack. Both commands accept `--dry-run`.

### Edit the manifest in the browser

If you cannot run the CLI, GitHub's file editor is enough. The manifest is plain
JSON and the only file that records upstream content.

1. Open your repository on GitHub and go to `content/packs.json`.
2. Choose the pencil icon (**Edit this file**).
3. Add or change one entry. `source` is the repository URL and `ref` is a **full
   40-character commit SHA**:

   ```json
   {
   	"cpacc": {
   		"source": "https://github.com/mocks-org/mocks-cpacc",
   		"ref": "bde1b60cf1ba5f04c5cfb51f0b6e2d2d24870f24"
   	}
   }
   ```

4. Commit to a branch and open a pull request, as you would for any change.

A SHA is not the same as a tag. On the pack repository, open the **Commits** page
(or the release), copy the full SHA, and paste it into `ref`. A tag or branch name
is rejected by `pnpm content:check` and would make the build unreproducible.

Editing the manifest by hand only changes the pin. You still need the pack's files
under `content/<exam>/`. The normal path is to let the sync CLI or the **Sync
content** action copy them, use the browser only for a pin you are sure matches the
committed directory.

To seed the browser-edited content into your deployed database, run
`pnpm bank:seed:remote --exam <exam>` locally, then deploy. The GitHub workflow
updates the repository, not D1.

## 4. Know what not to edit

| Path                        | Why                                                             |
| --------------------------- | --------------------------------------------------------------- |
| `content/<exam>/` (pinned)  | Managed by sync; edit the pack repository instead               |
| `build/bank/`               | Generated by `pnpm bank:build`                                  |
| `drizzle/`                  | Migrations are generated by `pnpm db:generate`                  |
| `worker-configuration.d.ts` | Generated by `wrangler types`                                   |
| `.github/workflows/`        | The sync workflow and PR gate are part of the template contract |

The bundled `content/demo/` pack is the exception: edit it directly if you need to
change the demo, then regenerate `scripts/seed-demo.sql` with
`pnpm bank:build content/demo` and concatenate the per-bank SQL in exam-then-practice
order. Do not add the demo to the manifest.

## 5. Keep it updated

There is no upstream merge. You pull content by moving a pin, and you pull app
changes by reviewing the upstream repository yourself and applying what you want.
Content changes should arrive as pull requests in the pack repository, and in your
app repository through the **Sync content** workflow, so nothing lands unreviewed.

A sync may only write under `content/`. If a diff appears in `src/` or a config
file, close the pull request: that is a failed sync, not something to keep.

## Checklist

- [ ] `pnpm install` and `pnpm wrangler:init`
- [ ] D1 database created, id pasted into `wrangler.jsonc`
- [ ] `pnpm db:migrate:local` and `pnpm bank:seed:local`
- [ ] Packs chosen, pinned, and validated with `pnpm content:check`
- [ ] `site.ts` edited, `site.url` matches the deployed origin
- [ ] `.svx` pages replaced
- [ ] Footer licence links match the packs you actually ship
- [ ] Actions enabled, **Sync content** run once to confirm the PR flow
- [ ] `pnpm check && pnpm lint && pnpm test:unit -- --run` pass
