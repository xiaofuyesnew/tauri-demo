# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the Vue 3 frontend.
- `src/components/` holds UI components (`CompMain.vue`, `CompA.vue`, etc.).
- `src/views/` contains route-level pages (currently `Home.vue`).
- `src/router/` defines routes and history mode.
- `src/store/` contains Pinia stores and setup helpers.
- `src/composables/` contains reusable Composition API utilities.
- `src-tauri/` contains the Rust/Tauri backend (`src/lib.rs`, `tauri.conf.json`, `capabilities/`, and app icons).
- `public/` stores static assets served by Vite.

## External Source Boundaries
- Do not modify any source files under `t-dock-manager/`.
- Treat `t-dock-manager` as a read-only upstream package. Integrations must use its existing build artifacts from `t-dock-manager/dist`.
- If behavior needs to change, adapt this application code in `src/` or `src-tauri/` instead of editing `t-dock-manager`.

## Build, Test, and Development Commands
- `pnpm install`: install JS dependencies.
- `pnpm dev`: run the Vite frontend in development mode.
- `pnpm build`: produce a production frontend build.
- `pnpm preview`: preview the production frontend build locally.
- `pnpm tauri dev`: run the full desktop app (frontend + Tauri shell).
- `pnpm tauri build`: create desktop application artifacts.
- Optional Rust checks from `src-tauri/`: `cargo check`.

## Coding Style & Naming Conventions
- Use 2-space indentation in Vue/JS files and 4-space indentation in Rust.
- Follow existing naming patterns:
- PascalCase for Vue components (`CompA.vue`).
- camelCase for functions/variables (`setupRouter`, `useGlobalStore`).
- Keep route names and component file names aligned where possible.
- Prefer single quotes in JS/TS unless surrounding code in the file uses double quotes; stay consistent within edited files.
- Keep Vue SFC blocks ordered as `<script>`, `<template>`, `<style>`.

## Testing Guidelines
- No automated test suite is configured yet (`package.json` has no `test` script).
- For new features, add targeted tests when introducing test infrastructure (Vitest for frontend and/or Rust tests under `src-tauri`).
- For now, validate changes by running:
- `pnpm build`
- `pnpm tauri dev` and manually exercising affected flows.

## Commit & Pull Request Guidelines
- Current history uses Conventional Commit style (example: `chore: init demo`).
- Use concise, scoped messages, e.g., `feat(router): add settings route`, `fix(store): persist window state`.
- PRs should include:
- clear summary of behavior changes,
- linked issue/task if available,
- screenshots or short recordings for UI changes,
- verification steps (commands run and manual checks).
