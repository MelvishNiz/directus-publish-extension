# Directus Extension Development Guide

## Project Overview
This is a **Directus extension bundle** containing both an API endpoint and a custom module. Directus extensions follow a specific architecture where:
- **Endpoints** (`src/endpoint-publish/`) provide custom API routes on the server side
- **Modules** (`src/module-publish/`) add custom pages/views to the Directus admin interface
- Both are packaged as a single bundle via `directus:extension` configuration in `package.json`

## Architecture & Key Concepts

### Extension Bundle Structure
The project uses Directus's bundle extension type, allowing multiple extensions to be packaged together:
- `package.json` defines the bundle with `"type": "bundle"` and lists entries for each sub-extension
- Each entry specifies `type`, `name`, and `source` path
- Build outputs to `dist/app.js` (frontend) and `dist/api.js` (backend)

### Module vs Endpoint Pattern
- **Endpoints** (`defineEndpoint`): Express-style router for REST APIs, runs server-side
  - Example: `src/endpoint-publish/index.ts` defines routes using Express router pattern
  - Access via `/your-directus-url/endpoint-publish/`
- **Modules** (`defineModule`): Vue 3 components with routing, runs in admin UI
  - Example: `src/module-publish/index.ts` exports module config with routes
  - `module.vue` uses Directus's `<private-view>` component wrapper

### TypeScript Configuration
- Strict mode enabled with comprehensive null checks and type safety
- `rootDir: "./src"` - all source must be in src directory
- Vue components require `shims.d.ts` for `.vue` module declarations

## Development Workflow

### Build Commands
- **Development**: `bun run dev` - watch mode with unminified output for debugging
- **Production**: `bun run build` - minified bundle for deployment
- **Validation**: `bun run validate` - check extension compatibility

### Local Development Setup
1. Build the extension: `bun run dev`
2. Link to Directus instance: `bun run link` (points extension to running Directus)
3. Restart Directus to load changes

### Adding New Components
- Use `bun run add` to scaffold new extension types
- Follow the `defineEndpoint` or `defineModule` pattern from existing code
- Update `package.json` entries array to register new extensions

## Project-Specific Conventions

### Vue Components
- Use `<private-view>` wrapper for module pages (Directus's authenticated view component)
- Import from `vue` not `@vue/runtime-core`
- Components must be registered in module's `routes` array

### Endpoint Patterns
- Use Express router methods directly (`router.get`, `router.post`, etc.)
- Return responses with `res.send()` or `res.json()`
- Endpoints auto-prefixed with extension name in URL

### Naming Convention
- Endpoints: `endpoint-{name}/index.ts`
- Modules: `module-{name}/index.ts` + `module.vue`
- Keep names hyphenated and lowercase

## Dependencies & Tooling
- **Runtime**: Bun (not Node.js) - use `bun` commands, not `npm`
- **SDK**: `@directus/extensions-sdk` v16.0.2 - provides `defineEndpoint`, `defineModule`
- **Framework**: Vue 3.5+ for frontend modules
- **Host requirement**: Directus ^10.10.0 (specified in `package.json`)

## Common Pitfalls
- Don't run `bun run index.ts` - the README is outdated; use `bun run dev` or `bun run build`
- Vue component changes require Directus restart to reflect in admin UI
- Module ID in `defineModule` must be unique across all Directus extensions
- Endpoint routes are relative to the extension's base path, not Directus root
