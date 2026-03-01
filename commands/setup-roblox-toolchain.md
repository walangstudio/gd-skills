---
description: Set up the full Roblox external development toolchain. Generates rokit.toml, default.project.json, wally.toml, selene.toml, stylua.toml, and a GitHub Actions CI workflow in one shot.
---

# Setup Roblox Toolchain Command

## What This Command Does

Scaffolds the complete external Roblox development environment:

- `rokit.toml` — pins Rojo, Wally, Selene, StyLua, Darklua, Lune, Zap versions
- `default.project.json` — Rojo project mapping `src/` to DataModel
- `wally.toml` — package manifest with common Roblox packages
- `selene.toml` — Luau linter config with Roblox stdlib
- `stylua.toml` — formatter config
- `.github/workflows/ci.yml` — lint + format CI pipeline

## Usage

```
/setup-roblox-toolchain
```

Run in your project root before starting development.

## Prerequisites

Install Rokit first (one-time, system-wide):

**macOS / Linux:**
```bash
curl -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.ps1 | iex
```

Then install all project tools:
```bash
rokit install    # reads rokit.toml, installs pinned versions
wally install    # downloads Packages/
```

## Files Generated

```
my-roblox-project/
├── rokit.toml                        # tool version pins
├── default.project.json              # Rojo DataModel mapping
├── wally.toml                        # package manifest
├── selene.toml                       # linter config
├── stylua.toml                       # formatter config
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint + format CI
└── src/
    ├── server/
    │   └── init.server.lua
    ├── client/
    │   └── init.client.lua
    └── shared/
        └── types.lua
```

## Next Steps

1. `rokit install` — install all tools
2. `wally install` — download packages to `Packages/`
3. `rojo serve` — start file sync server
4. Open Roblox Studio → Rojo plugin → Connect
5. Edit files in VS Code, changes sync live to Studio

## Related

- `/setup-roblox` — Studio-only project setup (no external toolchain)
- `roblox-toolchain` skill — full toolchain reference docs
- `roblox-specialist` agent — Luau implementation help

---

**Scaffold your Roblox toolchain!** Use `/setup-roblox-toolchain` to generate all config files at once.
