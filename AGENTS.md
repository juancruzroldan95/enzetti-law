# AGENTS.md

## Project Overview

This project is the website for "Estudio Enzetti" (Enzetti Law), built using the Astro framework. It serves as the digital presence for the law firm.

## Setup Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (starts at `localhost:4321`)
- **Build for production**: `npm run build` (outputs to `./dist/`)
- **Preview build**: `npm run preview`

## Tech Stack

- **Framework**: Astro 5
- **Styling**: Tailwind CSS 4 (configured in `tailwind.config.mjs`)
- **Language**: TypeScript (`tsconfig.json` present), HTML/Astro components

## Project Structure

- `src/pages/`: Contains the application routes.
- `src/components/`: Reusable UI components.
- `src/layouts/`: Page layouts (e.g., `Layout.astro`).
- `src/sections/`: Specialized section components for landing pages.
- `public/`: Static assets.

## Code Style & Conventions

- **TypeScript**: Use strict mode.
- **Components**: Prefer `.astro` components for layout and structure.
- **Styling**: Use Tailwind CSS utility classes where possible.
- **Formatting**: Follow standard Prettier/EditorConfig settings if available.
- **Icons**: Store icon components in `src/icons/`. Use icons from [Tabler Icons](https://tabler.io/icons).

## Agent Instructions

- When adding new pages, ensure they are compatible with Astro's file-based routing in `src/pages/`.
- Use `src/layouts/Layout.astro` as the wrapper for new pages to maintain consistency.
- Check `tailwind.config.mjs` for custom theme configurations before adding arbitrary CSS values.
