# Anim Explorer — VS Code Extension

<p align="center">
  <img src="vs_animator.png" alt="Anim Explorer Logo" width="180" />
</p>

<p align="center">
  <strong>A feature-rich VS Code extension that brings animated color themes, a smart file explorer, selection tracking, and GitHub branch display — all in one panel.</strong>
</p>

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
- [Screenshots & UI Overview](#screenshots--ui-overview)
- [Requirements](#requirements)
- [Installation & Setup](#installation--setup)
- [How to Launch (Development)](#how-to-launch-development)
- [Available Commands](#available-commands)
- [Extension Settings](#extension-settings)
- [File & Folder Structure](#file--folder-structure)
- [Package Dependencies](#package-dependencies)
- [How the Color Animation Works](#how-the-color-animation-works)
- [Color Palettes](#color-palettes)
- [Security Design](#security-design)
- [Performance Design](#performance-design)
- [Building & Compiling](#building--compiling)

---

## What It Does

**Anim Explorer** is a VS Code extension that adds:

1. **Animated Color Themes** — Smoothly cycles VS Code's entire UI chrome (title bar, activity bar, sidebar, status bar, tabs) through 8 hand-crafted color palettes (dark + light).
2. **Clickable Palette Grid** — A webview panel shows all 8 palettes as clickable cards. Click any card to instantly apply that palette.
3. **File Explorer Sidebar** — A custom activity-bar tree that lists your workspace files with directories first, skipping clutter like `node_modules` and `.git`.
4. **Selection Tracker** — When you highlight text in the editor, the webview panel shows the selected text and line count in real time.
5. **Git Branch Status Bar** — Reads the current git branch via VS Code's built-in Git API and displays it in the status bar.
6. **Animated Webview Canvas** — A pulsing, color-reactive canvas animation in the webview panel that reacts to the active theme accent color.

---

## Features

| Feature | Description |
|---|---|
| Color animation | Cycles 8 palettes with smooth cross-fades (160 ms ticks, 10-step interpolation) |
| Click-to-apply palette | Click any card in the grid to instantly apply that palette and stop the cycle |
| Filter tabs | Filter palette grid by **All / Dark / Light** |
| Default reset | One-click "Default" button restores VS Code's original colors |
| File tree sidebar | Workspace file browser with folder-first sort, ignore list, auto-refresh |
| Selection tracking | Live display of selected text + line count in the webview panel |
| Git branch status bar | Shows current branch in the status bar using VS Code's Git API |
| Animated canvas | GPU-accelerated canvas pulse that reacts to accent color changes |
| Secure webview | CSP nonces, HTML escaping, workspace path validation |

---

## Screenshots & UI Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  VS Code Window (title bar, tabs — animated color)              │
├──────────┬──────────────────────────────────────────────────────┤
│ Activity │  Sidebar (Files tree)   │   Editor Area              │
│  Bar     │  ├── src/               │                            │
│  (anim)  │  │   ├── commands/      │   [ Webview Panel ]        │
│          │  │   ├── features/      │   Logo + Canvas            │
│          │  │   ├── providers/     │   Palette Grid             │
│          │  │   └── utils/         │   [All] [Dark] [Light]     │
│          │  ├── media/             │   ┌──┐ ┌──┐ ┌──┐          │
│          │  └── package.json       │   │🟢│ │🔵│ │🟣│ ...      │
│          │                         │   └──┘ └──┘ └──┘          │
│          │                         │   [Auto] [Stop] [Default]  │
│          │                         │   Selection info           │
├──────────┴─────────────────────────┴────────────────────────────┤
│  Status Bar: ⎇ main   |  Anim Theme: Neon Green  (animated)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Requirements

- **VS Code** `1.85.0` or newer
- **Node.js** `18+` (for building from source)
- **npm** `9+`

No runtime dependencies — everything ships with the extension.

---

## Installation & Setup

### Option A — Install from `.vsix` (easiest)

A pre-built package `my-vscode-anim-extension-0.0.1.vsix` is included in the project root.

1. Open VS Code
2. Open the Command Palette (`Ctrl+Shift+P`)
3. Run **"Extensions: Install from VSIX..."**
4. Select `my-vscode-anim-extension-0.0.1.vsix`
5. Reload VS Code when prompted

### Option B — Build and run from source

Follow the steps in [How to Launch (Development)](#how-to-launch-development) below.

---

## How to Launch (Development)

### Step 1 — Clone / open the project

Open the folder `d:\my-vscode-anim-extension` in VS Code.

### Step 2 — Install dependencies

Open the integrated terminal (`Ctrl+` `` ` ``) and run:

```bash
npm install
```

This installs all `devDependencies` listed in `package.json` (TypeScript, type definitions, ESLint).

### Step 3 — Compile TypeScript

```bash
npm run compile
```

This runs `tsc -p ./` and outputs compiled JavaScript into the `out/` folder.

> To watch for changes automatically during development:
> ```bash
> npm run watch
> ```

### Step 4 — Launch the Extension Development Host

Press **`F5`** in VS Code (or go to **Run → Start Debugging**).

This opens a second VS Code window called the **Extension Development Host** with your extension loaded and active.

### Step 5 — Open the Anim Explorer panel

In the Extension Development Host window:

- Look for the **Anim Explorer icon** in the **Activity Bar** (left sidebar) — it is the custom SVG icon.
- Click it to open the **Files** tree view.
- Click the **panel icon** in the tree view title bar to open the **Webview Panel**.

Or use the Command Palette (`Ctrl+Shift+P`) and run:

```
Anim Explorer: Open Animated Panel
```

### Step 6 — Start the color animation

In the Command Palette, run:

```
Anim Explorer: Start Color Animation
```

The VS Code UI chrome will begin cycling through all 8 color palettes with smooth cross-fades.

---

## Available Commands

All commands are in the `Anim Explorer` category. Access them via `Ctrl+Shift+P`.

| Command | ID | What It Does |
|---|---|---|
| Open Animated Panel | `animExplorer.openPanel` | Opens or focuses the webview panel |
| Refresh File Tree | `animExplorer.refreshFileTree` | Re-reads workspace and refreshes the sidebar tree |
| Open File | `animExplorer.openFile` | Opens a file from the sidebar tree in the editor |
| Start Color Animation | `animExplorer.startTheme` | Begins cycling all 8 palettes with cross-fades |
| Stop Color Animation | `animExplorer.stopTheme` | Pauses the cycle, keeps the current palette |
| Reset Theme Colors | `animExplorer.resetTheme` | Removes all color overrides, restores VS Code defaults |
| Apply Color Palette | `animExplorer.applyPalette` | Instantly applies one named palette (used by card clicks) |

---

## Extension Settings

These can be changed in **Settings → Extensions → Anim Explorer** or in `settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `animExplorer.animationSpeed` | `number` | `1.5` | Canvas animation speed multiplier (0.5 = slow, 2.0 = fast) |
| `animExplorer.showStatusBar` | `boolean` | `true` | Show active file info in the status bar |
| `animExplorer.accentColor` | `string` | `"#61dafb"` | Accent color for decorations and animations (hex value) |

---

## File & Folder Structure

```
my-vscode-anim-extension/
│
├── 📄 package.json                  — Extension manifest: commands, views, settings, scripts
├── 📄 tsconfig.json                 — TypeScript compiler config (NodeNext, ES2020, strict)
├── 📄 package-lock.json             — Locked dependency tree (auto-generated by npm)
├── 📄 vs_animator.png               — Extension logo image
├── 📦 my-vscode-anim-extension-0.0.1.vsix  — Pre-built installable package
│
├── 📁 .vscode/                      — VS Code workspace config for developing this extension
│   ├── launch.json                  — Debug configs: "Run Extension" and "Extension Tests"
│   └── tasks.json                   — Build task that F5 triggers automatically
│
├── 📁 src/                          — All TypeScript source code
│   │
│   ├── extension.ts                 — ENTRY POINT: wires up all providers, commands, features
│   │
│   ├── 📁 commands/
│   │   └── openPanel.ts             — Registers the "Open Animated Panel" command
│   │
│   ├── 📁 providers/
│   │   ├── animationViewProvider.ts — Creates and manages the webview panel (HTML, IPC, state)
│   │   └── fileTreeProvider.ts      — Supplies data for the sidebar file tree (TreeDataProvider)
│   │
│   ├── 📁 features/
│   │   ├── themeAnimator.ts         — Core color animation: 8 palettes, cross-fade, apply/stop/reset
│   │   ├── selectionWatcher.ts      — Watches editor selection changes, debounces webview updates
│   │   ├── decorations.ts           — Applies highlight decoration to selected text (cached type)
│   │   └── github.ts                — Reads current git branch, shows it in the status bar
│   │
│   └── 📁 utils/
│       └── colors.ts                — Color helpers: hexToRgb, rgbToHex, lerpColor, hexWithAlpha
│
├── 📁 media/                        — Static assets served to the webview (cannot import npm)
│   ├── webview.js                   — Webview-side JavaScript: canvas, palette grid, IPC listener
│   ├── styles.css                   — All webview CSS: layout, cards, tabs, animations, GPU hints
│   └── 📁 icons/
│       ├── activity-bar.svg         — Icon shown in the VS Code activity bar (left sidebar)
│       ├── panel-dark.svg           — Panel icon for dark themes
│       └── panel-light.svg          — Panel icon for light themes
│
└── 📁 out/                          — Compiled JavaScript output (auto-generated, do not edit)
    ├── extension.js
    ├── commands/
    ├── features/
    ├── providers/
    └── utils/
```

### What each file does in plain language

| File | Plain English |
|---|---|
| `src/extension.ts` | The "main" of the extension. Activates everything: creates the file tree, webview panel, registers all commands, starts file watchers, and wires the status bar. |
| `src/providers/animationViewProvider.ts` | Builds the HTML for the webview panel, handles messages from the webview (palette clicks, open file), and pushes updates to the webview (accent color changes, selection text). |
| `src/providers/fileTreeProvider.ts` | Reads the workspace folder from disk and returns a sorted list (directories first) for VS Code's tree widget. Refreshes whenever files are added or deleted. |
| `src/features/themeAnimator.ts` | Holds all 8 color palettes. Runs a 160 ms interval that interpolates every VS Code color token between the current and next palette. Writes results to `workbench.colorCustomizations` in VS Code settings. |
| `src/features/selectionWatcher.ts` | Listens to cursor/selection changes in the editor. Applies a highlight decoration immediately, and sends the selected text to the webview after an 80 ms debounce. |
| `src/features/decorations.ts` | Manages a single `TextEditorDecorationType` that highlights the selected line. Caches and reuses the type unless the accent color changes (avoids memory leaks). |
| `src/features/github.ts` | Uses VS Code's built-in Git extension API to read the current branch name and shows it in a status bar item. |
| `src/utils/colors.ts` | Pure color math: convert hex ↔ RGB, linear interpolate between two colors, add alpha, rotate hue. |
| `media/webview.js` | Runs inside the sandboxed webview iframe. Draws the canvas pulse animation, renders the palette card grid, handles filter tab clicks, and sends messages back to the extension when the user clicks a card. |
| `media/styles.css` | All the visual styling for the webview: logo ring, animated rainbow bar, palette cards, filter tabs, selection info box. Uses `will-change` for GPU-accelerated animations. |

---

## Package Dependencies

### Runtime dependencies

None. The extension has **zero runtime npm dependencies** — it uses only VS Code's built-in APIs.

### Dev dependencies (needed to build from source)

These are listed in `package.json` under `devDependencies` and installed by `npm install`:

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5.3.0` | Compiles `.ts` source files to `.js` for VS Code to load |
| `@types/vscode` | `^1.85.0` | TypeScript type definitions for all VS Code APIs |
| `@types/node` | `^20.0.0` | TypeScript type definitions for Node.js built-ins (`path`, `fs`, etc.) |
| `@typescript-eslint/parser` | `^6.0.0` | Parses TypeScript code for ESLint |
| `@typescript-eslint/eslint-plugin` | `^6.0.0` | ESLint rules specific to TypeScript |
| `eslint` | `^8.0.0` | Linting: catches code style and potential bug patterns |

### Install all dev dependencies

```bash
npm install
```

### Check what is installed

```bash
npm list --depth=0
```

---

## How the Color Animation Works

1. **8 palettes** are defined in `src/features/themeAnimator.ts`. Each has a name, type (dark/light), accent color, and a full map of VS Code color tokens (title bar, activity bar, status bar, sidebar, tabs, menus, etc.).

2. **A 160 ms interval** (`setInterval`) runs a `_tick()` function that counts up from 0 to 10 (interpolation steps) and then moves to the next palette.

3. **`lerpColor(a, b, t)`** in `src/utils/colors.ts` linearly interpolates between two hex colors at fraction `t` (0.0–1.0). Each tick, every color token is blended between the current palette and the target palette.

4. **`workbench.colorCustomizations`** in VS Code settings is written with the blended colors. VS Code reacts immediately, re-painting the entire UI chrome.

5. **Hold phase**: after reaching t=1.0, the animator holds for 15 ticks before moving to the next palette.

6. **Callbacks**: each time the palette changes, a callback fires so the webview panel can highlight the active palette card and update the canvas accent color.

---

## Color Palettes

| # | Name | Type | Accent Color |
|---|---|---|---|
| 1 | Neon Green | Dark | `#00ff88` |
| 2 | Neon Blue | Dark | `#00d4ff` |
| 3 | Dark Purple | Dark | `#c060ff` |
| 4 | Soft Mint | Light | `#15803d` |
| 5 | Sky Blue | Light | `#1d4ed8` |
| 6 | Lavender | Light | `#7c3aed` |
| 7 | Sunset | Light | `#c2410c` |
| 8 | Rose Gold | Light | `#be123c` |

Use the **Filter tabs** in the webview panel (All / Dark / Light) to show only the category you want.

---

## Security Design

The webview is secured in three layers:

1. **Content Security Policy (CSP)** — A per-session random `nonce` is generated for the script tag. Only scripts with a matching nonce are allowed to execute. Inline styles are allowed for dynamic color updates.

2. **HTML Escaping** — All file names and paths embedded into the webview HTML pass through `escapeHtml()` which converts `&`, `<`, `>`, and `"` to their HTML entity equivalents. This prevents XSS if a file happens to be named something like `<script>alert(1)</script>`.

3. **Path Traversal Prevention** — When the webview asks the extension to open a file (via `postMessage`), the extension checks that the requested path falls inside one of the open workspace folders using `path.normalize()` before calling `openTextDocument`. Requests outside the workspace are blocked and logged.

---

## Performance Design

| Area | Optimization |
|---|---|
| Decoration type | Cached and reused across selection events; only recreated when the accent color changes |
| Webview notifications | Debounced 80 ms so rapid cursor moves don't flood the webview with messages |
| Canvas drawing | Skips `drawPulse()` body when `document.hidden` is true (tab not visible), but keeps `requestAnimationFrame` scheduled |
| CSS animations | `will-change: background-position` on animated background elements; `will-change: transform` on the rotating logo — promotes them to GPU compositor layers |
| Color writes | Interpolation runs 10 steps per palette transition with a 15-tick hold — writes to VS Code settings at 160 ms intervals (not every frame) |
| Event delegation | Palette card clicks use a single listener on the `#paletteGrid` container instead of one listener per card |

---

## Building & Compiling

| Script | Command | What It Does |
|---|---|---|
| Compile once | `npm run compile` | Runs `tsc -p ./`, outputs to `out/` |
| Watch mode | `npm run watch` | Re-compiles automatically on every file save |
| Lint | `npm run lint` | Runs ESLint on all `src/` TypeScript files |
| Package | `npm run vscode:prepublish` | Compiles before packaging (runs automatically by `vsce package`) |

### Compile output location

All `.ts` files in `src/` are compiled to matching `.js` + `.js.map` files in `out/`:

```
src/extension.ts          →  out/extension.js
src/features/github.ts    →  out/features/github.js
src/providers/...ts       →  out/providers/...js
...
```

VS Code loads `out/extension.js` as the extension entry point (set in `package.json` → `"main"`).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm run build` fails | The correct script is `npm run compile` (not `build`) |
| `Cannot find name 'path'` in IDE | Ensure `"types": ["node", "vscode"]` is in `tsconfig.json` |
| Extension not activating | Run `npm run compile` first, then press F5 |
| Colors not animating | Open Command Palette → `Anim Explorer: Start Color Animation` |
| Colors stuck after testing | Open Command Palette → `Anim Explorer: Reset Theme Colors` |
| File tree is empty | Open a workspace folder first (`File → Open Folder`) |

---

## License

MIT — free to use, modify, and distribute.
