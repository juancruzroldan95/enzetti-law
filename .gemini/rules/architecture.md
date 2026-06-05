# Architecture - Estudio Enzetti

This document describes the architectural layout, core systems, and data flow of the Estudio Enzetti website to guide AI/agentic development.

---

## 1. System Overview & Framework

The website is built on **Astro 5** as a hybrid Server-Side Rendered (SSR) application deployed on Vercel.

- **Routing Model**: Hybrid routing. Astro processes pages on the server side (`output: 'server'`) with Vercel's serverless runtime.
- **Incremental Static Regeneration (ISR)**: Configured in `astro.config.mjs` for caching static pages with an expiration limit (`60 * 60 * 24` or 24 hours). Specific routes like API endpoints are excluded from ISR.
- **Sentry Integration**: Used for error tracking and exception capturing both on the server and client sides, configured via `@sentry/astro` and initialized in root configs.

---

## 2. Directory Layout

The codebase uses a clear directory structure mapped via strict path aliases in [tsconfig.json](../../tsconfig.json):

```
src/
├── assets/       # Static assets, images, webp layouts
├── components/   # Layout-agnostic UI modules (@components/*)
├── consts/       # Shared constant files (@consts/*)
├── icons/        # Independent Tabler Icon components (@icons/*)
├── layouts/      # Page layouts (Layout.astro) (@layouts/*)
├── pages/        # File-based routes and API handlers (@pages/*)
├── scripts/      # Client-side scripts and animations (@utils/*)
├── sections/     # High-level responsive landing sections (@sections/*)
├── services/     # API integration layers (@services/*)
└── types/        # TypeScript DTO mappings (@dto/*)
```

### Core Architecture Components

- **Layouts** ([Layout.astro](../../src/layouts/Layout.astro)):
  Serves as the main HTML envelope, injecting unified head configuration:
  - Canonical SEO URLs and structured Google Places JSON-LD schema metadata.
  - Social media OpenGraph and Twitter tags.
  - Vercel Web Analytics and Speed Insights script components.
  - Global stylesheets and shared UI blocks (`Header`, `Footer`, `MobileMenu`, `WhatsAppWidget`, `CookieBanner`).

- **Services** ([src/services/](../../src/services/)):
  - [sentry.ts](../../src/services/sentry.ts): Provides unified wrapper `captureException(error, context)` to capture exceptions through `@sentry/astro`.
  - [google.ts](../../src/services/google.ts): Fetches data from Google Places API v1 (`places.googleapis.com`) using `X-Goog-Api-Key` and `X-Goog-FieldMask` for ratings, review counts, and display details.
  - [instagram.ts](../../src/services/instagram.ts): Integrates with Meta's Graph API to query follower counts, profile images, and recent media items, including token-refresh mechanics.
  - [tiktok.ts](../../src/services/tiktok.ts): Manages TikTok auth redirects, authorization code exchanges, and refreshing tokens to retrieve profile data and recent feed lists.
  - [vercel.ts](../../src/services/vercel.ts): Interacts with Vercel's HTTP API to patch environment variables (like Meta/Instagram tokens) and programmatically trigger production redeployments.

- **API Routes**:
  Located in `src/pages/api/` as serverless functions:
  - `/api/refresh-instagram-token`: Triggered by a webhook/cron job to refresh long-lived tokens, update Vercel variables, and redeploy.
  - `/api/tiktok/login` & `/api/tiktok/callback`: OAuth pipeline for TikTok authentication.

---

## 3. Data Flow & Rendering Strategy

1. **Static Build & ISR**:
   - High-level sections retrieve data (like Google reviews, Instagram feeds, and TikTok statistics) during page render on server-side requests.
   - When a page request occurs and the ISR cache is valid, the rendered page is served instantly.
   - If the ISR cache is expired (over 24 hours), the server fetches updated data in the background, rebuilds the page, and updates the cache.

2. **Error Isolation**:
   - Third-party fetches are wrapped in `try/catch` statements.
   - On error, `captureException` logs the stack trace to Sentry, and the service returns `null`.
   - Sections render conditional UI blocks (`googleReviews && (...)` or `instagramData && (...)`), ensuring the page remains operational even if third-party integrations fail.
