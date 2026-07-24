# Security - Estudio Enzetti

This document describes the security protocols, configuration rules, and environment variable protections established in the Estudio Enzetti workspace to guide AI/agentic development.

---

## 1. Environment Variables Safety

- **Server vs Client**:
  - Private environment variables are only accessible on the server side. The full list of environment variables used in the project includes:
    - `CRON_SECRET`
    - `GOOGLE_PLACES_API_KEY`
    - `GOOGLE_PLACE_ID`
    - `INSTAGRAM_ACCESS_TOKEN`
    - `INSTAGRAM_USER_ID`
    - `META_APP_ID`
    - `META_APP_SECRET`
    - `SENTRY_AUTH_TOKEN`
    - `TIKTOK_CLIENT_KEY`
    - `TIKTOK_CLIENT_SECRET`
    - `TIKTOK_REDIRECT_URI`
    - `TIKTOK_REFRESH_TOKEN`
    - `VERCEL_INSTAGRAM_ENV_ID`
    - `VERCEL_PROJECT_ID`
    - `VERCEL_TOKEN`
  - Never reference private environment variables inside client-side `<script>` blocks embedded in `.astro` components, as these run directly in user browsers.
- **Safety Validations**:
  - Always verify variable availability in frontmatter or service functions before initiating third-party calls.
  - Return early with appropriate warnings or fallback states (e.g. returning `null` or a generic component instead of crashing the SSR route).

---

## 2. API & Webhook Authentication

- **Bearer Authorization**:
  - Serverless routes designed to run as scheduled jobs (such as [refresh-instagram-token.ts](../../src/pages/api/refresh-instagram-token.ts)) must be protected.
  - Check the incoming `Authorization` request header and validate it as `Bearer <CRON_SECRET>`.
  - Return `401 Unauthorized` immediately if credentials are missing or do not match the private `CRON_SECRET` variable.
- **OAuth Callback Security**:
  - Verify state parameters during OAuth sequences (like TikTok logins) to prevent cross-site request forgery (CSRF).
  - Explicitly restrict callback responses to safe admin environments or private workflows, and prevent outputting internal tokens in raw format unless strictly required for admin setups.

---

## 3. Vercel Programmatic Deployments

- **Token Protection**:
  - Environment variable patches and project redeploy requests via [vercel.ts](../../src/services/vercel.ts) must remain server-side.
  - Guard the production redeploy webhook trigger route to prevent arbitrary users from exhausting serverless execution time or triggering DDoS build states.

---

## 4. XSS & Code Execution Prevention

- **set:html Directives**:
  - Avoid using Astro's `set:html` directive for rendering unescaped user inputs.
  - For structured JSON-LD data (e.g., `Layout.astro` schema setup), serialize the data objects through standard `JSON.stringify` before applying them to scripts.
- **Client Script Isolation**:
  - Do not dynamically evaluate strings (`eval`) or execute raw code on client scripts.
  - Keep animations separate and bound to pre-selected selectors.
