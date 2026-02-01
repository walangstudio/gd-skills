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

### Fixed
- Command injection vulnerability in hooks.json — moved inline `node -e` to standalone .js scripts
- Flying enemy movement bug in platformer template (conflicting velocity + position writes)
- Copilot uninstaller now properly cleans gd-skills content from `copilot-instructions.md`

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
