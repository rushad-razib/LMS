# First production deploy (cPanel)

After the Deploy workflow exists in the repo, finish these once on your machine / cPanel / GitHub.

## 1. SSH deploy key

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\lms_deploy -N '""' -C "github-actions-lms-deploy"
```

- Append `lms_deploy.pub` to the server `~/.ssh/authorized_keys` (cPanel → SSH Access, or SSH yourself).
- Put the **private** key contents in GitHub → Settings → Secrets → Actions as `DEPLOY_SSH_KEY`.

## 2. GitHub Actions secrets

| Secret | Example / notes |
|--------|-----------------|
| `DEPLOY_HOST` | server hostname or IP |
| `DEPLOY_USER` | cPanel username (e.g. `rushadra`) |
| `DEPLOY_SSH_KEY` | full private key (`BEGIN`/`END` lines included) |
| `DEPLOY_PATH` | `/home/<user>/lms.rushadrazib.com` |
| `DATABASE_URL` | same MySQL URL as cPanel Node env — **GitHub Secret only, never commit** |
| `DEPLOY_PORT` | `22` (omit if default) |
| `DEPLOY_NODE_ACTIVATE` | `/home/<user>/nodevenv/lms.rushadrazib.com/22/bin/activate` (optional; workflow also tries this path) |

## 3. Node app checklist

- Startup file: `apps/api/dist/server.js`
- Mode: Production
- Env already set: `WEB_ORIGIN`, `DATABASE_URL`, JWTs
- For Phase 3 payments also set: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE=false` (sandbox), and `API_ORIGIN=https://lms.rushadrazib.com` (same host is fine) so IPN/success callbacks resolve

## 4. Trigger deploy

Push to `main` (or Actions → Deploy → Run workflow).

The job builds, uploads via one tar-over-SSH session (cPanel often has no rsync), runs `npm install`, `prisma migrate deploy`, and `touch tmp/restart.txt`. Remote commands use `bash --noprofile --norc` so login does not source `/etc/profile.d` (those scripts fork `grep` and can fail when NPROC is tight).

### If upload fails with `fork: Resource temporarily unavailable`

cPanel **NPROC** was full **during the job** (login or `npm`/`prisma` could not fork). Statistics is a live snapshot — check it while the workflow is running, not after.

1. cPanel → Setup Node.js App → **Stop** the app (do not start extra Node copies).
2. Kill leftover `npm` / `npx` / `prisma` / extra `node` (Process Manager or SSH `pkill`).
3. Confirm Number Of Processes is well below the cap and RAM is not pinned at 2G.
4. Run **one** Deploy. After `Deploy finished.`, Start App if it is still stopped, or rely on `tmp/restart.txt`.

Skipping profile scripts does not reduce `npm install` / `prisma` process use. Free slots first if NPROC is still near 100.

## 5. Seed admin (once, over SSH)

With the nodevenv activated and `DATABASE_URL` available:

```bash
cd ~/lms.rushadrazib.com
# copy seed script from repo or run locally against prod DB carefully
```

Prefer seeding from your laptop against prod only if intentional:

```bash
# from monorepo root, with DATABASE_URL pointing at prod (careful)
pnpm db:seed
```

Or SSH and run a one-off after copying `apps/api` seed tooling — simplest path: run `pnpm db:seed` locally with a temporary `.env` `DATABASE_URL` set to production (then revert).

## 6. Verify

- https://lms.rushadrazib.com/
- https://lms.rushadrazib.com/api/v1/health
