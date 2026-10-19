# submit.sdk — agent entry

Rules live in the meta repo. Read in this order:

1. `../submitcms/AGENTS.md` — workspace rules and Working Constitution (skip if already loaded).
2. `../submitcms/submit.sdk/RULES.md` — rules for this repo.
3. `./llms.txt` — module map of this repo.

Work on a task branch from `live` in a worktree (`submit branch`), then `submit ship`. Never push `live` or `main`.
Dev notes for this repo: `../submitcms/submit.sdk/YYYY-MM/`. Create with `submit note new submit.sdk <slug>`.
