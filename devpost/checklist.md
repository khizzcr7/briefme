---
status: approved
project: BriefMe
mode: fast
---

# Build checklist — BriefMe

- [x] Skill pack installed (`npx skills add challengepost/learn-ai-basics --all -y`)
- [x] Scope, PRD, and spec written and approved before code
- [x] Slice 1 — server skeleton: Express + TypeScript, health endpoint, static hosting
- [x] Slice 2 — brief engine: Gemini structured-JSON call + validation + demo-mode fallback
- [x] Slice 3 — seeded sample documents (meeting, article, support thread)
- [x] Slice 4 — single-page UI: input panel, sample chips, brief cards, copy-as-Markdown
- [x] Slice 5 — error states and length validation, friendly messages
- [x] Verification — `tsc` clean, curl smoke tests pass, UI walkthrough done
- [x] README, LICENSE (MIT), .env.example, .gitignore
- [ ] Public GitHub repo + push — local repo ready (branch `main`, remote `origin` = https://github.com/khizzcr7/briefme.git). Blocked from the agent side: GitHub connector create_repository returned "403 Resource not accessible by integration" (the Muse GitHub App cannot create repos), gh CLI is not logged in, and no git credentials exist. Remaining step: create the empty public repo `briefme` under khizzcr7 in the GitHub web UI, then `git push -u origin main`.
- [ ] Demo video, 1–3 min screen recording (Khizar's hands)
- [ ] Final submit on Devpost before Mon Oct 26, 5:00 PM ET
