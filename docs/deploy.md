# Deploy to Cloudflare

The app is a SvelteKit Worker with a D1 database. You need a Cloudflare account, Node 26, pnpm 12, and a fork or clone of this repository.

> The local D1 database works without an account, only the remote steps below need one.

## 1. Create the local config

```sh
pnpm install
pnpm wrangler:init       # copies wrangler.example.jsonc to wrangler.jsonc
```

Edit `wrangler.jsonc`:

- `name` -- your worker name. Rename it so it does not collide with another deployment in your account.
- `d1_databases[0].database_name` -- your database name. The scripts read it from here, so renaming it needs no code change.
- `d1_databases[0].database_id` -- the id printed by `wrangler d1 create` below.
- `compatibility_date` -- keep it at or after the committed value (the `nodejs_als` flag the app relies on is already set in `compatibility_flags`).

The committed placeholder id (`00000000-…`) is valid for local migrations and the PR gate, so you can develop before creating a database.

## 2. Create the D1 database

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create <database-name>
```

Paste the printed `database_id` into `wrangler.jsonc`. The binding stays `DB`. The package scripts target the binding, not the database name.

## 3. Check it locally

```sh
pnpm db:migrate:local
pnpm db:seed:demo:local
pnpm dev
```

- `bank:seed:local` validates and builds every pack on disk, the pinned ones and the bundled demo, then applies the SQL to local D1.
- A fresh fork has no installed packs, so the demo is what you seed first (`pnpm db:seed:demo:local`).
- After `pnpm content:add`, run `pnpm bank:seed:local` to seed everything, or `pnpm bank:seed:local --exam <slug>` to seed one pack.
- The same flag works for the remote seed below. Open `/portal/<exam>` to confirm the exam renders.

Before deploying, run what the PR gate runs, plus the unit suite:

```sh
pnpm content:check
pnpm bank:validate
pnpm check && pnpm lint
pnpm test:unit -- --run
```

## 4. Migrate and seed the remote database

```sh
pnpm db:migrate:remote
pnpm bank:seed:remote --exam <exam>
```

- `bank:seed:remote` replaces that bank's questions, modules, and bank row, and upserts the shared exam row.
- It is destructive for the named bank.
- **Always pass `--exam <slug>`.** Without it the command seeds every pack on disk, including the bundled demo, into the remote database.
- The slug seeds every bank that pack ships (`exam` and `practice`), so you do not need a second run.
- Seed the demo only on local databases.

Content is **not** migrated by Drizzle. Migrations own the schema, the seed owns the questions. Merging a content pull request updates the repository, not D1, so every content change needs a seed.

## 5. Build and deploy

```sh
pnpm build
pnpm exec wrangler deploy
```

`pnpm build` runs `wrangler types`, strips generated globals, and builds the worker, the Cloudflare adapter writes the entry point and assets. Do not add `main` to `wrangler.jsonc`.

The first deploy prints a `workers.dev` URL. If you want a custom domain:

1. Add the domain to Cloudflare and create a Worker route or custom domain in the Cloudflare dashboard.
2. Set `site.url` in `src/lib/settings/site.ts` to that origin, with no trailing slash. It drives canonical and Open Graph URLs.
3. Redeploy. If you only want the custom domain, you can disable `workers_dev` and `preview_urls` in `wrangler.jsonc` (both are enabled in the example config).

## 6. Enable the repository workflows

In your GitHub repository:

1. **Settings → Actions → General** -- allow Actions to run, and allow workflows to create pull requests. The sync workflow declares `contents: write` and `pull-requests: write`. The repository setting must not block it.
2. **Settings → Branches** -- protect `main` and require the three PR gate jobs by their exact names: `Quality (svelte-check + lint)`, `Content (manifest + bank rules)`, and `Accessibility (axe-core A/AA/AAA + best practices)`. Pull requests into `main` then cannot merge with a broken build or invalid content.
3. **Actions → Sync content → Run workflow** once, after at least one pack is pinned, to confirm the pull-request path. On an empty manifest the run simply reports that there is nothing to sync. If you fill the `ref` input, fill `exam` too: a commit belongs to one pack repository, so a ref without a pack is rejected.

The workflow is manual on purpose: GitHub disables scheduled workflows after about 60 days of repository inactivity, silently, which would break exactly the deployments that rely on it.

The a11y job seeds the bundled demo pack, so it never fetches a pack over the network. The content job validates the demo plus every pinned pack.

## Updating deployed content

1. Release the pack repository (bump `bank.version`, tag `vX.Y.Z`).
2. In the app repo, run **Actions → Sync content → Run workflow** (optionally choosing one pack, and a ref if you also choose that pack), or locally `pnpm content:update <exam>`.
3. Review the pull request: the **old → new refs**, per-module question deltas, and a link to the release. Merge it only if the diff is confined to `content/`.
4. Seed the remote database and deploy:

   ```sh
   git pull
   pnpm bank:seed:remote --exam <exam>
   pnpm build
   pnpm exec wrangler deploy
   ```

To roll back a content change, move the pin back with `pnpm content:update <exam> --ref <previous-sha>`, commit that, seed the remote database again, and redeploy. Wrangler's own rollback only restores worker code, D1 content is whatever you last seeded.

## Troubleshooting

| Symptom                                                | Cause and fix                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler types` fails on a missing binding            | `wrangler.jsonc` is absent. Run `pnpm wrangler:init`.                                                                                                               |
| `/portal/<exam>` is a 404 or the lobby is empty        | The database was migrated but not seeded. Run `pnpm bank:seed:remote --exam`.                                                                                       |
| Only the demo exam exists in production                | The remote seed ran without `--exam`, so it seeded the bundled demo. Re-run `pnpm bank:seed:remote --exam <slug>`.                                                  |
| Homepage returns 503                                   | No published exam in D1, or the seeded exam has no published questions. Seed a pack with `pnpm bank:seed:remote --exam <exam>`. Locally, `pnpm db:seed:demo:local`. |
| Canonical URLs point at `workers.dev`                  | `site.url` still has the upstream default. Set it to your origin.                                                                                                   |
| Sync action fails with "wrote outside `content/`"      | The sync is refusing an unsafe diff. Do not merge, investigate the pack.                                                                                            |
| Remote migration succeeds but deploy uses old bindings | Seed and deploy from the same `wrangler.jsonc`, then redeploy.                                                                                                      |

The app stores no attempt history, emits no analytics, and needs no secrets beyond what Wrangler handles.

> Review current Cloudflare Workers and D1 limits before importing a very large bank.
