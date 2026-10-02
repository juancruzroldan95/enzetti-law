# AGENTS.md

## Project Overview

This project is the website for "Estudio Enzetti" (Enzetti Law), built using the Astro framework. It serves as the digital presence for the law firm.

## Codex Instructions

These instructions apply to the entire repository. Before making changes, read the relevant rule files inside `.agents/rules/`:
- **Architecture & System Layout**: See [architecture.md](./.agents/rules/architecture.md) for information on project structure, routing, serverless configurations, and integration layers.
- **Code Style & Style Guides**: See [conventions.md](./.agents/rules/conventions.md) for conventions regarding TypeScript strict checks, path aliases, Tailwind CSS v4 setup, animation logic, and custom Tabler icons.
- **Security & Authorization Rules**: See [security.md](./.agents/rules/security.md) for rules on credentials, environment variables, webhook authorization, and programmatic deployment security.

Use project skills in `.agents/skills/` when relevant to the task, and read their `SKILL.md` instructions before applying them.

Preserve existing user changes. Keep edits focused on the requested task and verify code changes with the appropriate checks below. Never print credentials or environment variable values in command output, logs, or responses.

## Setup Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (starts at `localhost:4321`)
- **Build for production**: `npm run build` (outputs to `./dist/`)
- **Check types and Astro diagnostics**: `npm run astro -- check`
- **Preview build**: `npm run preview`

## Tech Stack

- **Framework**: Astro 5 (SSR / Hybrid mode)
- **Styling**: Tailwind CSS 4 (configured via `@tailwindcss/vite` plugin and `src/styles/global.css`)
- **Language**: TypeScript (Strict Mode extended from `"astro/tsconfigs/strict"`)
- **Animations**: Motion (Motion One/Framer core library)
