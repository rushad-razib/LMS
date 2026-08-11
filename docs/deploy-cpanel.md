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

## 4. Trigger deploy

Push to `main` (or Actions → Deploy → Run workflow).

The job builds, uploads via tar over SSH (cPanel often has no rsync), runs `npm install`, `prisma migrate deploy`, and `touch tmp/restart.txt`.

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
