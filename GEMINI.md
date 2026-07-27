# GEMINI.md — Personal Website Instructions & Conventions

## Project Overview
- **Type:** Personal website & developer portfolio
- **Platform:** Cloudflare (Workers / Pages)
- **Language:** TypeScript (`strict: true`)
- **Runtime:** Cloudflare Edge Runtime (Web Standard APIs)

---

## Technical Stack & Constraints
1. **Runtime Limitations:**
   - Runs on the Cloudflare Edge runtime (V8 isolates), NOT standard Node.js.
   - Use Web Standard APIs (`fetch`, `Request`, `Response`, `URL`, `Crypto`, `Headers`).
   - Avoid Node.js-native modules (`fs`, `path`, `child_process`) unless `nodejs_compat` is explicitly enabled in `wrangler.jsonc`.

2. **Type Safety:**
   - Explicit TypeScript types everywhere. Avoid `any` at all costs.
   - Define all environment bindings, KV namespaces, R2 buckets, and secrets inside a central `Env` interface (typically in `env.d.ts` or `src/types.ts`).
   - Use strict request/response handling.

---

## Development & Build Commands
- **Local Development:** `npx wrangler dev`
- **Type Checking:** `npx tsc --noEmit`
- **Linting:** `npm run lint`
- **Deployment:** `npx wrangler deploy`

---

## Coding Standards & Best Practices

### TypeScript Conventions
- Use `interface` for object structures and API schemas; use `type` for unions/primitives.
- Always handle `null` and `undefined` explicitly (`exactOptionalPropertyTypes` / `noImplicitAny`).
- Favor immutable data patterns (`readonly`, `const`).
- Export pure functions and modular components.

### Cloudflare & Performance Best Practices
- **Edge-First Design:** Keep response payloads lightweight and leverage browser / CDN caching headers (`Cache-Control`).
- **Async & Execution Context:** Use `ctx.waitUntil()` for background tasks (e.g., analytics, logging) so they do not delay HTTP responses.
- **Environment Access:** Always access environment variables and secrets via the request context or `env` binding parameter (e.g., `(req, env, ctx)`), never from `process.env`.
- **Static Assets:** Route static assets via Cloudflare's native asset binding/routing. Do not manually read static files into memory.

### Error Handling & Security
- Never expose internal error stack traces or secret keys in public JSON responses.
- Implement explicit fallback handling for missing dynamic parameters or failed KV/R2 fetches.
- Always validate incoming inputs/route parameters.

---

## Agent Behavioral Rules
- **Minimal Changes:** Modify only the files required to solve the task. Do not rewrite working code unnecessarily.
- **Verification First:** Always ensure type checks (`tsc --noEmit`) pass before completing a task.
- **No Speculative Dependencies:** Do not add external npm libraries without explicit instruction if a Web Standard or native Cloudflare API can handle it.

## Communication & Response Style
- Response Style: Always adhere to being strictly minimal. Skip preambles, conversational filler, and verbose step-by-step summaries. Focus purely on required code changes, tool calls, and terse execution notes.
- Planning: Skip heavy planning artifacts unless explicitly instructed otherwise. For large tasks, provide a high-level task outline first and then prompt for user input.

## Git & Pull Request Workflow
1. **Branching:** Work must occur on feature branches named `feat/<name>` or `fix/<name>`. Local commits to `master` are forbidden.
2. **PR Process:**
   - Commit changes atomically with descriptive commit messages.
   - Do not include `Co-authored-by` metadata trailers.
   - Push feature branch to GitHub.
   - Monitor GitHub Actions runs via the `gh` CLI.
   - Open a Pull Request via `gh pr create` with a descriptive title and body.
   - Merge and close the PR via `gh pr merge --merge --delete-branch` once CI checks turn green.
   - Check out local `master` branch and pull updates: `git checkout master && git pull origin master`.
   - Tagging/Release: Suggest a new tag version based on the latest git tag (e.g., query latest tag using `git describe --tags --abbrev=0`), and prompt the user for confirmation. Upon confirmation, create the tag locally and push it to GitHub: `git tag vX.Y.Z && git push origin vX.Y.Z`.