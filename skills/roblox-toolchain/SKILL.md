# Roblox Toolchain

Modern external development workflow for Roblox using VS Code + Rokit-managed tools.

## Tools

| Tool | Role | Version |
|------|------|---------|
| **Rokit** | Toolchain manager — installs/pins all other tools | 1.x |
| **Rojo** | File sync: VS Code ↔ Roblox Studio | 7.x |
| **Wally** | Package manager (`wally.toml` + `Packages/`) | 0.3.x |
| **Selene** | Luau linter | 0.30.x |
| **StyLua** | Luau formatter | 2.x |
| **Darklua** | Code transformer (path→require rewrites) | 0.17.x |
| **Lune** | Standalone Luau runtime for build scripts | latest |
| **Zap** | Buffer-based networking (replaces RemoteEvents for perf) | latest |

---

## 1. Project Bootstrap

### rokit.toml
```toml
[tools]
rojo = "rojo-rbx/rojo@7.4.4"
wally = "upliftgames/wally@0.3.2"
selene = "kampfkarren/selene@0.30.0"
stylua = "johnnymorganz/stylua@2.0.2"
darklua = "seaofvoices/darklua@0.17.0"
lune = "lune-org/lune@0.9.4"
zap = "red-blox/zap@0.16.0"
```

Install all tools:
```bash
rokit install
```

Rokit pins tool versions per-project in `rokit.toml` and installs to a local `.rokit/` cache. No global installs, no version conflicts.

---

## 2. Rojo Project Structure

### default.project.json
```json
{
  "name": "MyGame",
  "tree": {
    "$className": "DataModel",
    "ServerScriptService": {
      "$className": "ServerScriptService",
      "Server": {
        "$path": "src/server"
      }
    },
    "ReplicatedStorage": {
      "$className": "ReplicatedStorage",
      "Shared": {
        "$path": "src/shared"
      },
      "Packages": {
        "$path": "Packages"
      }
    },
    "StarterPlayer": {
      "$className": "StarterPlayer",
      "StarterPlayerScripts": {
        "$className": "StarterPlayerScripts",
        "Client": {
          "$path": "src/client"
        }
      }
    },
    "StarterGui": {
      "$path": "src/ui"
    }
  }
}
```

### src/ layout
```
src/
├── server/           → ServerScriptService/Server/
│   ├── init.server.lua
│   └── services/
├── client/           → StarterPlayerScripts/Client/
│   ├── init.client.lua
│   └── controllers/
├── shared/           → ReplicatedStorage/Shared/
│   ├── network/
│   └── types.lua
└── ui/               → StarterGui/
    └── MainHud/
```

### Workflow
```bash
rojo serve              # start sync server
# Open Roblox Studio → Rojo plugin → Connect
# Edit files in VS Code, changes sync live to Studio
```

---

## 3. Wally Package Management

### wally.toml
```toml
[package]
name = "myorg/mygame"
version = "0.1.0"
registry = "https://github.com/UpliftGames/wally-index"
realm = "shared"

[dependencies]
Knit = "evaera/knit@1.5.0"
ProfileService = "madstudioroblox/profileservice@1.0.0"
Signal = "sleitnick/signal@1.4.0"
TableUtil = "sleitnick/tableutil@1.2.0"

[server-dependencies]
# server-only packages

[dev-dependencies]
TestEZ = "roblox/testez@0.4.1"
```

Install packages:
```bash
wally install       # downloads to Packages/
```

Use in code:
```lua
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Signal = require(ReplicatedStorage.Packages.Signal)

local mySignal = Signal.new()
```

Commit `wally.lock` to git. Add `Packages/` to `.gitignore` (or commit it — team choice).

---

## 4. Selene Config

### selene.toml
```toml
std = "roblox"

[rules]
empty_if = "warn"
global_usage = "deny"
must_use = "warn"
shadowing = "warn"
suspicious_reverse_loop = "warn"
unbalanced_assignments = "warn"
undefined_variable = "deny"
```

### .selene/roblox.toml (auto-generated)
```bash
selene generate-roblox-std   # generates roblox.toml with all Roblox globals
```

Run:
```bash
selene src/
```

---

## 5. StyLua Config

### stylua.toml
```toml
column_width = 100
line_endings = "Unix"
indent_type = "Spaces"
indent_width = 4
quote_style = "AutoPreferDouble"
call_parentheses = "Always"
collapse_simple_statement = "Never"
```

Run:
```bash
stylua src/               # format all files
stylua --check src/       # check without modifying (CI)
```

---

## 6. CI/CD — GitHub Actions

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rokit
        run: |
          curl -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash
          echo "$HOME/.rokit/bin" >> $GITHUB_PATH

      - name: Install tools
        run: rokit install

      - name: Check formatting (StyLua)
        run: stylua --check src/

      - name: Lint (Selene)
        run: selene src/

      - name: Install Wally packages
        run: wally install

      - name: Run Lune tests
        run: lune run scripts/test.luau
```

---

## 7. Zap Networking

Zap generates strongly-typed networking code from a schema, replacing hand-written RemoteEvent boilerplate.

### network.zap
```
-- Define events
event DamagePlayer {
    from: Client,
    type: Reliable,
    call: SingleSync,
    data: struct {
        target: u8,
        damage: u8,
    }
}

event UpdateHealth {
    from: Server,
    type: Reliable,
    call: ManyAsync,
    data: struct {
        player: u8,
        health: u16,
    }
}
```

Generate code:
```bash
zap network.zap
# → src/shared/network/zap_generated.lua (server)
# → src/shared/network/zap_generated_client.lua (client)
```

Use generated code:
```lua
--!strict
-- Server
local Network = require(ReplicatedStorage.Shared.network.zap_generated)
Network.UpdateHealth.fire(player, { player = playerId, health = 100 })

-- Client
local Network = require(ReplicatedStorage.Shared.network.zap_generated_client)
Network.DamagePlayer.fire({ target = targetId, damage = 25 })
```

Zap advantages over raw RemoteEvents:
- Compile-time type safety on both ends
- Buffer packing (smaller network payload)
- No `typeof()` validation boilerplate — schema enforces types

---

## 8. Lune Build Scripts

Lune runs Luau outside Studio — use for build automation, code generation, and test runners.

### scripts/build.luau
```lua
local fs = require("@lune/fs")
local process = require("@lune/process")

-- Run wally install
local wallyResult = process.spawn("wally", {"install"})
if not wallyResult.ok then
    error("wally install failed:\n" .. wallyResult.stderr)
end

-- Run rojo build
local rojoResult = process.spawn("rojo", {"build", "default.project.json", "--output", "build/game.rbxl"})
if not rojoResult.ok then
    error("rojo build failed:\n" .. rojoResult.stderr)
end

print("Build complete: build/game.rbxl")
```

### scripts/test.luau
```lua
local process = require("@lune/process")

-- Run selene
local seleneResult = process.spawn("selene", {"src/"})
if not seleneResult.ok then
    print(seleneResult.stdout)
    error("Selene lint failed")
end

-- Run stylua check
local styluaResult = process.spawn("stylua", {"--check", "src/"})
if not styluaResult.ok then
    error("StyLua format check failed — run `stylua src/` to fix")
end

print("All checks passed")
```

Run scripts:
```bash
lune run scripts/build.luau
lune run scripts/test.luau
```

---

## Toolchain vs Studio-Only

| Scenario | Recommendation |
|----------|----------------|
| Solo hobby project, simple game | Studio-only — less setup overhead |
| Team project (2+ developers) | External toolchain — Rojo enables git workflow |
| Open-source or community project | External toolchain — Wally for deps, CI for quality |
| Performance-critical networking | Add Zap for typed buffer networking |
| Complex build pipeline | Add Lune for scripted builds |
| New Roblox developer | Studio-only first, add toolchain once comfortable |
