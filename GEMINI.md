# GEMINI.md

## Project Overview

This project is the website for "Estudio Enzetti" (Enzetti Law), built using the Astro framework. It serves as the digital presence for the law firm.

## Developer Agent Rules

For detailed instructions on architecture, conventions, and security, refer to the rule files inside `.gemini/rules/`:
- **Architecture & System Layout**: See [architecture.md](./.gemini/rules/architecture.md) for information on project structure, routing, serverless configurations, and integration layers.
- **Code Style & Style Guides**: See [conventions.md](./.gemini/rules/conventions.md) for conventions regarding TypeScript strict checks, path aliases, Tailwind CSS v4 setup, animation logic, and custom Tabler icons.
- **Security & Authorization Rules**: See [security.md](./.gemini/rules/security.md) for rules on credentials, environment variables, webhook authorization, and programmatic deployment security.

## Setup Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (starts at `localhost:4321`)
- **Build for production**: `npm run build` (outputs to `./dist/`)
- **Preview build**: `npm run preview`

## Tech Stack

- **Framework**: Astro 5 (SSR / Hybrid mode)
- **Styling**: Tailwind CSS 4 (configured via `@tailwindcss/vite` plugin and `src/styles/global.css`)
- **Language**: TypeScript (Strict Mode extended from `"astro/tsconfigs/strict"`)
- **Animations**: Motion (Motion One/Framer core library)
