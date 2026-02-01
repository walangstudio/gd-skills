# MCP Configurations

This directory contains example MCP (Model Context Protocol) server configurations for integrating external game development tools with Claude Code.

## Available Configs

### `godot-mcp-example.json`
Example configuration for connecting to a Godot Engine MCP server. Enables Claude Code to:
- Run Godot scenes directly
- Access the Godot debugger
- Read scene tree state
- Execute GDScript in the editor

### `unity-mcp-example.json`
Example configuration for Unity Engine integration. Enables Claude Code to:
- Run Unity Test Runner tests
- Build projects for target platforms
- Read Unity Console output
- Execute C# code in the editor

### `unreal-mcp-example.json`
Example configuration for Unreal Engine integration. Enables Claude Code to:
- Build projects (Development/Shipping)
- Run Automation tests
- Read Unreal output log
- Execute console commands

### `roblox-mcp-example.json`
Example configuration for Roblox Studio integration. Enables Claude Code to:
- Read the Explorer tree (DataModel)
- Execute Luau code in Studio
- Publish places to Roblox
- Run playtest sessions

### `web-mcp-example.json`
Example configuration for web game development using Puppeteer. Enables Claude Code to:
- Open games in a browser for visual testing
- Take screenshots of game state
- Simulate user input (clicks, keyboard)
- Execute JavaScript in the browser console

## How to Use

1. Copy the example config to your Claude Code MCP settings
2. Install the required MCP server (see each config for details)
3. Restart Claude Code to activate the integration

## Creating Your Own MCP Integration

MCP servers can extend Claude Code with:
- **Engine CLI access**: Run builds, tests, exports
- **Live debugging**: Read game state, set breakpoints
- **Asset management**: Import, convert, optimize assets
- **Scene editing**: Modify scenes programmatically

See the [Claude Code MCP documentation](https://docs.anthropic.com/claude-code/mcp) for details on creating custom MCP servers.
