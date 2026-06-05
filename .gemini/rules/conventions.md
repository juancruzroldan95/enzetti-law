# Conventions - Estudio Enzetti

This document lists the coding conventions, style rules, and component patterns established in the Estudio Enzetti codebase to guide AI/agentic development.

---

## 1. TypeScript & Paths

- **Strict Compilation**: The project extends `"astro/tsconfigs/strict"`. Ensure strict type checking is maintained (no implicit `any`, strict null checks, etc.).
- **Path Aliases**: Always use configured path aliases in [tsconfig.json](../../tsconfig.json) rather than relative paths. Supported aliases include:
  - `@assets/*` -> `./src/assets/*`
  - `@components/*` -> `./src/components/*`
  - `@consts/*` -> `./src/consts/*`
  - `@icons/*` -> `./src/icons/*`
  - `@layouts/*` -> `./src/layouts/*`
  - `@pages/*` -> `./src/pages/*`
  - `@sections/*` -> `./src/sections/*`
  - `@services/*` -> `./src/services/*`
  - `@dto/*` -> `./src/types/*`
  - `@utils/*` -> `./src/utils/*`

- **DTO Definition**: Keep third-party API data transfer structures (interfaces, types) in dedicated files inside `src/types/` (aliased as `@dto/*`) for easy access and strict typing.

---

## 2. Astro Components Structure

- **Structure**: Organize `.astro` components with:
  1. Frontmatter (`---` script block) for server-side logic, component imports, props, and API fetches.
  2. HTML/JSX template for layout and structure.
  3. Client-side `<script>` tag or styles if strictly component-bound.
- **Dynamic Classes**: Compute style variation classes inside the frontmatter and inject them cleanly into the template.
- **Self-Contained Logic**: Keep presentation logic inside components and delegate heavy external fetches to the `services/` directory.

---

## 3. Tailwind CSS & Styling (Tailwind v4)

The project uses **Tailwind CSS v4** via `@tailwindcss/vite` integration.

- **Theme Extensions**: Maintained within [src/styles/global.css](../../src/styles/global.css) in the `@theme` block.
- **Primary Brand Colors**:
  - `--color-primary`: Medium-dark zinc gray (`zinc-600` base, text / UI elements).
  - `--color-accent`: Brand red (`red-600` base, accent highlights).
  - `--color-background`: Slate background (`slate-50`).
  - `--color-surface`: Surface container white (`white`).
- **Typography Tokens**:
  - `--font-sans`: "Plus Jakarta Sans", sans-serif.
  - `--font-serif`: "Lora Variable", serif (active serif font for display/heading hierarchy).
- **Core Typography Rules**:
  - All `h1, h2, h3` tags must use `font-family: var(--font-serif)`.
  - All `h4, h5, h6` tags and body text must use `var(--font-sans)`.
- **Reusable Utility Classes**:
  - `.eyebrow`: All-caps, small font size, tracked, accent color. Used for section subheadings.
  - `.accent-rule`: Inlines decorative borders surrounding text elements for headers.
  - **Vector Textures**: Background SVG patterns like `.texture-crosshatch`, `.texture-crosshatch-light`, and `.texture-plus-light`.

---

## 4. Icon System

- **Storage Location**: Save all icons as individual `.astro` components inside [src/icons/](../../src/icons/).
- **Origin Reference**: Use SVG designs matching [Tabler Icons](https://tabler.io/icons).
- **Component Packaging**: Wraps raw SVG code with custom Astro attributes (e.g. support for `{...Astro.props}` or standard CSS class forwarding).

---

## 5. UI Animations & Client Scripts

Client-side UI animations are powered by the **Motion** library:

- **Client Scripts Scope**: Keep animations inside clean `<script>` tags within sections or in dedicated files like [src/scripts/service-animations.js](../../src/scripts/service-animations.js).
- **Preferred API**: Use standard functions from `motion`:
  - `animate()` for element transitions and spring-based layouts.
  - `inView()` to trigger staggering/entry animations when objects scroll into view.
  - `stagger()` for cascading animations on lists and lists grids (e.g. FAQs).
- **Scroll Anim Counters**: For statistics, animate values from `0` to the target attribute with `onUpdate` to format numbers dynamically.
