# Changelog

All notable changes to gd-skills will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - Unreleased

### Added
- Integrity verification via CHECKSUMS.sha256 in both installers
- Backup of existing files before install/upgrade
- Copilot instructions deduplication (no more duplicated content on reinstall)
- Missing engine context files: `roblox-mode.md`, `unreal-mode.md`
- PostToolUse hooks for Unreal (.cpp/.h) and JavaScript/TypeScript (.js/.ts) files
- Cross-reference validation script (`scripts/validate-references.sh`)
- GitHub Actions CI/CD pipeline for automated validation
- Roblox and Unreal code examples in platformer template
- MCP config examples for Unity, Unreal, Roblox, and Web engines
- CHANGELOG.md and CONTRIBUTING.md
- **Defold as a first-class 6th engine**: `defold-specialist` agent, `defold-style` rule, `defold-mode` context, `defold-patterns` skill, `/setup-defold`, MCP config, and a `.script`/`.gui_script`/`.render_script` advisory hook; Defold code in all 9 shared component skills and all 11 genre templates
- **Opt-in depth layer** (never slows the `/create-*` path): version-pinned engine-reference docs (`docs/engine-reference/`), architecture pattern guides (`guides/`), entity registry + `/consistency-check`, session-state checkpoint + `/checkpoint` + SessionStart resume hook, opt-in review gates + `/review-gate` (`guides/review-gates.md`), `/build-team`, verification-driven dev + `/acceptance`, prompt cookbook, and doc templates (`docs/templates/`)
- Discipline agents: `narrative-designer`, `accessibility-specialist`, `security-engineer`
- Depth directories (`docs`, `guides`, `design`) now installed for the Claude target
- Self-repair loop: `/self-repair` + `guides/self-repair-loop.md` — with a connected engine MCP, run → screenshot → diff vs intent → auto-fix (Godot/Defold first)
- `guides/rag-setup.md` — optional power-user path to index engine reference docs into a mememo vector store
- Runnable web samples: `samples/web/coin-collector`, `samples/web/snake`, `samples/web/breakout`, `samples/web/platformer` — dependency-free HTML5 canvas games, each with logic split from rendering and headless unit tests (`node test.js`); `scripts/test-samples.sh` runs them all in CI

### Fixed
- Command injection vulnerability in hooks.json — moved inline `node -e` to standalone .js scripts
- Flying enemy movement bug in platformer template (conflicting velocity + position writes)
- Copilot uninstaller now properly cleans gd-skills content from `copilot-instructions.md`
- README agent/command counts corrected (20 agents, 38 commands) across the intro, the `## All N Commands` header, and the architecture tree
- SessionStart checkpoint hook now reads the user's project cwd (from the hook stdin payload) instead of the plugin dir, and caps its output; the shipped checkpoint is now `active.example.md` so the placeholder is never dumped
- Defold PostToolUse matcher now also covers `.gui_script`/`.render_script`
- Removed dead delegation targets (`gameplay-designer`, `level-architect`); broadened `validate-references.sh` and the README link-check to catch 2-part and single-word command/agent names

### Security
- Hooks no longer use inline shell-interpolated file paths
- Added SHA256 checksum verification to detect tampered plugin files

## [1.0.0] - 2025-01-01

### Added
- Initial release
- 30 slash commands for game creation, components, debugging, and engine setup
- 15 specialized agents (5 engine specialists, 5 debuggers, 3 builders, 2 polish)
- 26 skills (11 genre templates, 9 shared components, 5 engine patterns, 1 structural)
- 6 coding rules (1 universal + 5 engine-specific)
- 3 engine context modes (Godot, Unity, Web)
- Cross-platform installers (bash + PowerShell)
- Multi-target support (Claude Code, Cursor, Windsurf, GitHub Copilot)
- 3 example workflow sessions
