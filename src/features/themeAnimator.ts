import * as vscode from 'vscode';
import { lerpColor } from '../utils/colors';

// ── Palette definitions ──────────────────────────────────────────────────────

export interface Palette {
  name: string;
  type: 'dark' | 'light';
  indicator: string;
  accent: string;
  /** Gradient stops for the card preview (start → mid → end) */
  preview: [string, string, string];
  colors: Record<string, string>;
}

export const PALETTES: Palette[] = [

  // ── DARK palettes ───────────────────────────────────────────
  {
    name: 'Neon Green', type: 'dark', indicator: 'G', accent: '#00ff88',
    preview: ['#091a0d', '#00cc6a', '#00ff88'],
    colors: {
      'titleBar.activeBackground':        '#091a0d',
      'titleBar.activeForeground':        '#00ff88',
      'titleBar.inactiveBackground':      '#061008',
      'titleBar.inactiveForeground':      '#3dcc77',
      'titleBar.border':                  '#00cc6a',
      'activityBar.background':           '#091a0d',
      'activityBar.foreground':           '#00ff88',
      'activityBar.inactiveForeground':   '#1a6640',
      'activityBar.border':               '#00aa55',
      'activityBarBadge.background':      '#00ff88',
      'activityBarBadge.foreground':      '#000000',
      'statusBar.background':             '#003d1f',
      'statusBar.foreground':             '#00ff88',
      'statusBar.border':                 '#00cc6a',
      'statusBarItem.hoverBackground':    '#005c2e',
      'sideBar.background':               '#0b1f0e',
      'sideBar.foreground':               '#b8ffcc',
      'sideBar.border':                   '#00aa55',
      'sideBarTitle.foreground':          '#00ff88',
      'sideBarSectionHeader.background':  '#062610',
      'sideBarSectionHeader.foreground':  '#00ff88',
      'editorGroupHeader.tabsBackground': '#091a0d',
      'tab.activeBackground':             '#153d1e',
      'tab.activeForeground':             '#00ff88',
      'tab.activeBorder':                 '#00ff88',
      'tab.inactiveBackground':           '#0b1f0e',
      'tab.inactiveForeground':           '#3d8057',
      'focusBorder':                      '#00ff88',
      'selection.background':             '#00ff8833',
      'menu.background':                  '#0b1f0e',
      'menu.foreground':                  '#b8ffcc',
      'menu.selectionBackground':         '#003d1f',
      'menu.selectionForeground':         '#00ff88',
      'menubar.selectionBackground':      '#003d1f',
      'menubar.selectionForeground':      '#00ff88',
      'panel.background':                 '#0b1f0e',
      'panel.border':                     '#00aa55',
      'panelTitle.activeForeground':      '#00ff88',
      'panelTitle.activeBorder':          '#00ff88',
      'scrollbarSlider.background':       '#00ff8830',
      'scrollbarSlider.hoverBackground':  '#00ff8855',
    },
  },

  {
    name: 'Neon Blue', type: 'dark', indicator: 'B', accent: '#00d4ff',
    preview: ['#081220', '#0099cc', '#00d4ff'],
    colors: {
      'titleBar.activeBackground':        '#081220',
      'titleBar.activeForeground':        '#00d4ff',
      'titleBar.inactiveBackground':      '#050c18',
      'titleBar.inactiveForeground':      '#3dbfee',
      'titleBar.border':                  '#0099cc',
      'activityBar.background':           '#081220',
      'activityBar.foreground':           '#00d4ff',
      'activityBar.inactiveForeground':   '#194d66',
      'activityBar.border':               '#0088bb',
      'activityBarBadge.background':      '#00d4ff',
      'activityBarBadge.foreground':      '#000000',
      'statusBar.background':             '#003348',
      'statusBar.foreground':             '#00d4ff',
      'statusBar.border':                 '#0099cc',
      'statusBarItem.hoverBackground':    '#004c6e',
      'sideBar.background':               '#091525',
      'sideBar.foreground':               '#b0e8ff',
      'sideBar.border':                   '#0088bb',
      'sideBarTitle.foreground':          '#00d4ff',
      'sideBarSectionHeader.background':  '#051020',
      'sideBarSectionHeader.foreground':  '#00d4ff',
      'editorGroupHeader.tabsBackground': '#081220',
      'tab.activeBackground':             '#112d40',
      'tab.activeForeground':             '#00d4ff',
      'tab.activeBorder':                 '#00d4ff',
      'tab.inactiveBackground':           '#091525',
      'tab.inactiveForeground':           '#3d7d99',
      'focusBorder':                      '#00d4ff',
      'selection.background':             '#00d4ff33',
      'menu.background':                  '#091525',
      'menu.foreground':                  '#b0e8ff',
      'menu.selectionBackground':         '#003348',
      'menu.selectionForeground':         '#00d4ff',
      'menubar.selectionBackground':      '#003348',
      'menubar.selectionForeground':      '#00d4ff',
      'panel.background':                 '#091525',
      'panel.border':                     '#0088bb',
      'panelTitle.activeForeground':      '#00d4ff',
      'panelTitle.activeBorder':          '#00d4ff',
      'scrollbarSlider.background':       '#00d4ff30',
      'scrollbarSlider.hoverBackground':  '#00d4ff55',
    },
  },

  {
    name: 'Dark Purple', type: 'dark', indicator: 'P', accent: '#c060ff',
    preview: ['#120a1f', '#8822bb', '#c060ff'],
    colors: {
      'titleBar.activeBackground':        '#120a1f',
      'titleBar.activeForeground':        '#c060ff',
      'titleBar.inactiveBackground':      '#0c0618',
      'titleBar.inactiveForeground':      '#9944cc',
      'titleBar.border':                  '#8822bb',
      'activityBar.background':           '#120a1f',
      'activityBar.foreground':           '#c060ff',
      'activityBar.inactiveForeground':   '#4d1a6e',
      'activityBar.border':               '#8822bb',
      'activityBarBadge.background':      '#c060ff',
      'activityBarBadge.foreground':      '#000000',
      'statusBar.background':             '#2d0048',
      'statusBar.foreground':             '#c060ff',
      'statusBar.border':                 '#8822bb',
      'statusBarItem.hoverBackground':    '#44006e',
      'sideBar.background':               '#150c22',
      'sideBar.foreground':               '#e0c0ff',
      'sideBar.border':                   '#8822bb',
      'sideBarTitle.foreground':          '#c060ff',
      'sideBarSectionHeader.background':  '#0e0820',
      'sideBarSectionHeader.foreground':  '#c060ff',
      'editorGroupHeader.tabsBackground': '#120a1f',
      'tab.activeBackground':             '#271040',
      'tab.activeForeground':             '#c060ff',
      'tab.activeBorder':                 '#c060ff',
      'tab.inactiveBackground':           '#150c22',
      'tab.inactiveForeground':           '#7d3d99',
      'focusBorder':                      '#c060ff',
      'selection.background':             '#c060ff33',
      'menu.background':                  '#150c22',
      'menu.foreground':                  '#e0c0ff',
      'menu.selectionBackground':         '#2d0048',
      'menu.selectionForeground':         '#c060ff',
      'menubar.selectionBackground':      '#2d0048',
      'menubar.selectionForeground':      '#c060ff',
      'panel.background':                 '#150c22',
      'panel.border':                     '#8822bb',
      'panelTitle.activeForeground':      '#c060ff',
      'panelTitle.activeBorder':          '#c060ff',
      'scrollbarSlider.background':       '#c060ff30',
      'scrollbarSlider.hoverBackground':  '#c060ff55',
    },
  },

  // ── LIGHT palettes ──────────────────────────────────────────
  {
    name: 'Soft Mint', type: 'light', indicator: 'M', accent: '#15803d',
    preview: ['#dcfce7', '#86efac', '#15803d'],
    colors: {
      'titleBar.activeBackground':        '#dcfce7',
      'titleBar.activeForeground':        '#14532d',
      'titleBar.inactiveBackground':      '#f0fdf4',
      'titleBar.inactiveForeground':      '#4d7a5c',
      'titleBar.border':                  '#86efac',
      'activityBar.background':           '#dcfce7',
      'activityBar.foreground':           '#15803d',
      'activityBar.inactiveForeground':   '#6aad80',
      'activityBar.border':               '#86efac',
      'activityBarBadge.background':      '#15803d',
      'activityBarBadge.foreground':      '#ffffff',
      'statusBar.background':             '#bbf7d0',
      'statusBar.foreground':             '#14532d',
      'statusBar.border':                 '#86efac',
      'statusBarItem.hoverBackground':    '#a7f3d0',
      'sideBar.background':               '#f0fdf4',
      'sideBar.foreground':               '#1a3d28',
      'sideBar.border':                   '#86efac',
      'sideBarTitle.foreground':          '#15803d',
      'sideBarSectionHeader.background':  '#dcfce7',
      'sideBarSectionHeader.foreground':  '#15803d',
      'editorGroupHeader.tabsBackground': '#dcfce7',
      'tab.activeBackground':             '#bbf7d0',
      'tab.activeForeground':             '#14532d',
      'tab.activeBorder':                 '#15803d',
      'tab.inactiveBackground':           '#f0fdf4',
      'tab.inactiveForeground':           '#4d7a5c',
      'focusBorder':                      '#15803d',
      'selection.background':             '#15803d33',
      'menu.background':                  '#f0fdf4',
      'menu.foreground':                  '#1a3d28',
      'menu.selectionBackground':         '#bbf7d0',
      'menu.selectionForeground':         '#14532d',
      'menubar.selectionBackground':      '#bbf7d0',
      'menubar.selectionForeground':      '#14532d',
      'panel.background':                 '#f0fdf4',
      'panel.border':                     '#86efac',
      'panelTitle.activeForeground':      '#15803d',
      'panelTitle.activeBorder':          '#15803d',
      'scrollbarSlider.background':       '#15803d30',
      'scrollbarSlider.hoverBackground':  '#15803d55',
    },
  },

  {
    name: 'Sky Blue', type: 'light', indicator: 'S', accent: '#1d4ed8',
    preview: ['#dbeafe', '#93c5fd', '#1d4ed8'],
    colors: {
      'titleBar.activeBackground':        '#dbeafe',
      'titleBar.activeForeground':        '#1e3a8a',
      'titleBar.inactiveBackground':      '#eff6ff',
      'titleBar.inactiveForeground':      '#4d6fa8',
      'titleBar.border':                  '#93c5fd',
      'activityBar.background':           '#dbeafe',
      'activityBar.foreground':           '#1d4ed8',
      'activityBar.inactiveForeground':   '#6a8dc2',
      'activityBar.border':               '#93c5fd',
      'activityBarBadge.background':      '#1d4ed8',
      'activityBarBadge.foreground':      '#ffffff',
      'statusBar.background':             '#bfdbfe',
      'statusBar.foreground':             '#1e3a8a',
      'statusBar.border':                 '#93c5fd',
      'statusBarItem.hoverBackground':    '#a5c8fe',
      'sideBar.background':               '#eff6ff',
      'sideBar.foreground':               '#1a2d5c',
      'sideBar.border':                   '#93c5fd',
      'sideBarTitle.foreground':          '#1d4ed8',
      'sideBarSectionHeader.background':  '#dbeafe',
      'sideBarSectionHeader.foreground':  '#1d4ed8',
      'editorGroupHeader.tabsBackground': '#dbeafe',
      'tab.activeBackground':             '#bfdbfe',
      'tab.activeForeground':             '#1e3a8a',
      'tab.activeBorder':                 '#1d4ed8',
      'tab.inactiveBackground':           '#eff6ff',
      'tab.inactiveForeground':           '#4d6fa8',
      'focusBorder':                      '#1d4ed8',
      'selection.background':             '#1d4ed833',
      'menu.background':                  '#eff6ff',
      'menu.foreground':                  '#1a2d5c',
      'menu.selectionBackground':         '#bfdbfe',
      'menu.selectionForeground':         '#1e3a8a',
      'menubar.selectionBackground':      '#bfdbfe',
      'menubar.selectionForeground':      '#1e3a8a',
      'panel.background':                 '#eff6ff',
      'panel.border':                     '#93c5fd',
      'panelTitle.activeForeground':      '#1d4ed8',
      'panelTitle.activeBorder':          '#1d4ed8',
      'scrollbarSlider.background':       '#1d4ed830',
      'scrollbarSlider.hoverBackground':  '#1d4ed855',
    },
  },

  {
    name: 'Lavender', type: 'light', indicator: 'L', accent: '#7c3aed',
    preview: ['#ede9fe', '#c4b5fd', '#7c3aed'],
    colors: {
      'titleBar.activeBackground':        '#ede9fe',
      'titleBar.activeForeground':        '#4c1d95',
      'titleBar.inactiveBackground':      '#faf5ff',
      'titleBar.inactiveForeground':      '#6d4ea8',
      'titleBar.border':                  '#c4b5fd',
      'activityBar.background':           '#ede9fe',
      'activityBar.foreground':           '#7c3aed',
      'activityBar.inactiveForeground':   '#9b7cc2',
      'activityBar.border':               '#c4b5fd',
      'activityBarBadge.background':      '#7c3aed',
      'activityBarBadge.foreground':      '#ffffff',
      'statusBar.background':             '#ddd6fe',
      'statusBar.foreground':             '#4c1d95',
      'statusBar.border':                 '#c4b5fd',
      'statusBarItem.hoverBackground':    '#cbbffd',
      'sideBar.background':               '#faf5ff',
      'sideBar.foreground':               '#2e1a5c',
      'sideBar.border':                   '#c4b5fd',
      'sideBarTitle.foreground':          '#7c3aed',
      'sideBarSectionHeader.background':  '#ede9fe',
      'sideBarSectionHeader.foreground':  '#7c3aed',
      'editorGroupHeader.tabsBackground': '#ede9fe',
      'tab.activeBackground':             '#ddd6fe',
      'tab.activeForeground':             '#4c1d95',
      'tab.activeBorder':                 '#7c3aed',
      'tab.inactiveBackground':           '#faf5ff',
      'tab.inactiveForeground':           '#6d4ea8',
      'focusBorder':                      '#7c3aed',
      'selection.background':             '#7c3aed33',
      'menu.background':                  '#faf5ff',
      'menu.foreground':                  '#2e1a5c',
      'menu.selectionBackground':         '#ddd6fe',
      'menu.selectionForeground':         '#4c1d95',
      'menubar.selectionBackground':      '#ddd6fe',
      'menubar.selectionForeground':      '#4c1d95',
      'panel.background':                 '#faf5ff',
      'panel.border':                     '#c4b5fd',
      'panelTitle.activeForeground':      '#7c3aed',
      'panelTitle.activeBorder':          '#7c3aed',
      'scrollbarSlider.background':       '#7c3aed30',
      'scrollbarSlider.hoverBackground':  '#7c3aed55',
    },
  },

  {
    name: 'Sunset', type: 'light', indicator: 'U', accent: '#c2410c',
    preview: ['#fed7aa', '#fb923c', '#c2410c'],
    colors: {
      'titleBar.activeBackground':        '#fed7aa',
      'titleBar.activeForeground':        '#7c2d12',
      'titleBar.inactiveBackground':      '#fff7ed',
      'titleBar.inactiveForeground':      '#a05030',
      'titleBar.border':                  '#fb923c',
      'activityBar.background':           '#fed7aa',
      'activityBar.foreground':           '#c2410c',
      'activityBar.inactiveForeground':   '#c27a50',
      'activityBar.border':               '#fb923c',
      'activityBarBadge.background':      '#c2410c',
      'activityBarBadge.foreground':      '#ffffff',
      'statusBar.background':             '#fdba74',
      'statusBar.foreground':             '#7c2d12',
      'statusBar.border':                 '#fb923c',
      'statusBarItem.hoverBackground':    '#fca85a',
      'sideBar.background':               '#fff7ed',
      'sideBar.foreground':               '#431407',
      'sideBar.border':                   '#fb923c',
      'sideBarTitle.foreground':          '#c2410c',
      'sideBarSectionHeader.background':  '#fed7aa',
      'sideBarSectionHeader.foreground':  '#c2410c',
      'editorGroupHeader.tabsBackground': '#fed7aa',
      'tab.activeBackground':             '#fdba74',
      'tab.activeForeground':             '#7c2d12',
      'tab.activeBorder':                 '#c2410c',
      'tab.inactiveBackground':           '#fff7ed',
      'tab.inactiveForeground':           '#a05030',
      'focusBorder':                      '#c2410c',
      'selection.background':             '#c2410c33',
      'menu.background':                  '#fff7ed',
      'menu.foreground':                  '#431407',
      'menu.selectionBackground':         '#fdba74',
      'menu.selectionForeground':         '#7c2d12',
      'menubar.selectionBackground':      '#fdba74',
      'menubar.selectionForeground':      '#7c2d12',
      'panel.background':                 '#fff7ed',
      'panel.border':                     '#fb923c',
      'panelTitle.activeForeground':      '#c2410c',
      'panelTitle.activeBorder':          '#c2410c',
      'scrollbarSlider.background':       '#c2410c30',
      'scrollbarSlider.hoverBackground':  '#c2410c55',
    },
  },

  {
    name: 'Rose Gold', type: 'light', indicator: 'R', accent: '#be123c',
    preview: ['#fce7f3', '#f9a8d4', '#be123c'],
    colors: {
      'titleBar.activeBackground':        '#fce7f3',
      'titleBar.activeForeground':        '#881337',
      'titleBar.inactiveBackground':      '#fff1f2',
      'titleBar.inactiveForeground':      '#9d3a5a',
      'titleBar.border':                  '#f9a8d4',
      'activityBar.background':           '#fce7f3',
      'activityBar.foreground':           '#be123c',
      'activityBar.inactiveForeground':   '#c47a8a',
      'activityBar.border':               '#f9a8d4',
      'activityBarBadge.background':      '#be123c',
      'activityBarBadge.foreground':      '#ffffff',
      'statusBar.background':             '#fbcfe8',
      'statusBar.foreground':             '#881337',
      'statusBar.border':                 '#f9a8d4',
      'statusBarItem.hoverBackground':    '#f9bcd8',
      'sideBar.background':               '#fff1f2',
      'sideBar.foreground':               '#4a0a20',
      'sideBar.border':                   '#f9a8d4',
      'sideBarTitle.foreground':          '#be123c',
      'sideBarSectionHeader.background':  '#fce7f3',
      'sideBarSectionHeader.foreground':  '#be123c',
      'editorGroupHeader.tabsBackground': '#fce7f3',
      'tab.activeBackground':             '#fbcfe8',
      'tab.activeForeground':             '#881337',
      'tab.activeBorder':                 '#be123c',
      'tab.inactiveBackground':           '#fff1f2',
      'tab.inactiveForeground':           '#9d3a5a',
      'focusBorder':                      '#be123c',
      'selection.background':             '#be123c33',
      'menu.background':                  '#fff1f2',
      'menu.foreground':                  '#4a0a20',
      'menu.selectionBackground':         '#fbcfe8',
      'menu.selectionForeground':         '#881337',
      'menubar.selectionBackground':      '#fbcfe8',
      'menubar.selectionForeground':      '#881337',
      'panel.background':                 '#fff1f2',
      'panel.border':                     '#f9a8d4',
      'panelTitle.activeForeground':      '#be123c',
      'panelTitle.activeBorder':          '#be123c',
      'scrollbarSlider.background':       '#be123c30',
      'scrollbarSlider.hoverBackground':  '#be123c55',
    },
  },
];

// ── State ────────────────────────────────────────────────────────────────────

let currentIndex  = 0;
let targetIndex   = 1;
let interpStep    = 0;
let holdCounter   = 0;
let mainTimer: ReturnType<typeof setInterval> | undefined;
let themeBarItem: vscode.StatusBarItem | undefined;
let onAccentChange: ((color: string, name: string) => void) | undefined;

/*
 * Timing constants.
 *
 * We write to workbench.colorCustomizations on every tick during a transition.
 * VS Code proxies each write through its settings layer, which ultimately
 * touches disk.  Using a 160 ms tick (instead of 80 ms) halves the number of
 * disk writes per transition (10 vs 20) while still looking smooth to the eye.
 *
 *   TICK_MS       – interval between timer callbacks
 *   INTERP_STEPS  – how many ticks a cross-fade takes  (10 × 160 ms = 1.6 s)
 *   HOLD_TICKS    – how many ticks we hold each palette (15 × 160 ms = 2.4 s)
 */
const TICK_MS      = 160;
const INTERP_STEPS = 10;
const HOLD_TICKS   = 15;

// ── Public API ───────────────────────────────────────────────────────────────

export function startThemeAnimation(
  context: vscode.ExtensionContext,
  accentCallback?: (color: string, name: string) => void
): void {
  stopThemeAnimation();
  onAccentChange = accentCallback;

  if (!themeBarItem) {
    themeBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
    themeBarItem.command = 'animExplorer.stopTheme';
    context.subscriptions.push(themeBarItem);
  }

  currentIndex = 0;
  targetIndex  = 1;
  interpStep   = 0;
  holdCounter  = HOLD_TICKS;

  _applyBlend(1.0);
  _updateBar();

  mainTimer = setInterval(_tick, TICK_MS);
}

export function stopThemeAnimation(): void {
  if (mainTimer) {
    clearInterval(mainTimer);
    mainTimer = undefined;
  }
  themeBarItem?.hide();
}

/** Apply a specific palette immediately (stops auto-cycle). */
export function applyPaletteByName(
  name: string,
  accentCallback?: (color: string, name: string) => void
): void {
  stopThemeAnimation();
  const idx = PALETTES.findIndex((p) => p.name === name);
  if (idx < 0) { return; }

  const palette = PALETTES[idx];
  const cfg    = vscode.workspace.getConfiguration();
  const target = vscode.workspace.workspaceFolders
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  cfg.update('workbench.colorCustomizations', palette.colors, target);

  accentCallback?.(palette.accent, palette.name);

  if (themeBarItem) {
    themeBarItem.text    = `[${palette.indicator}] ${palette.name}`;
    themeBarItem.tooltip = `Anim Theme: ${palette.name} — click to stop`;
    themeBarItem.show();
  }
}

export function resetTheme(): void {
  stopThemeAnimation();
  const cfg    = vscode.workspace.getConfiguration();
  const target = vscode.workspace.workspaceFolders
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  cfg.update('workbench.colorCustomizations', undefined, target);
  themeBarItem?.hide();
}

// ── Internal tick ────────────────────────────────────────────────────────────

function _tick(): void {
  if (holdCounter > 0) {
    holdCounter--;
    return;
  }

  interpStep++;
  const t = interpStep / INTERP_STEPS;
  _applyBlend(t);

  if (interpStep >= INTERP_STEPS) {
    currentIndex = targetIndex;
    targetIndex  = (targetIndex + 1) % PALETTES.length;
    interpStep   = 0;
    holdCounter  = HOLD_TICKS;
    _updateBar();
    onAccentChange?.(PALETTES[currentIndex].accent, PALETTES[currentIndex].name);
  }
}

// ── Blend & apply ────────────────────────────────────────────────────────────

function _applyBlend(t: number): void {
  const from = PALETTES[currentIndex].colors;
  const to   = PALETTES[targetIndex].colors;

  const blended: Record<string, string> = {};
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);

  for (const key of keys) {
    const a = from[key] ?? to[key];
    const b = to[key]   ?? from[key];
    blended[key] = lerpColor(a, b, t);
  }

  const cfg    = vscode.workspace.getConfiguration();
  const target = vscode.workspace.workspaceFolders
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  cfg.update('workbench.colorCustomizations', blended, target);
}

function _updateBar(): void {
  if (!themeBarItem) { return; }
  const p = PALETTES[currentIndex];
  themeBarItem.text    = `[${p.indicator}] ${p.name}`;
  themeBarItem.tooltip = `Anim Theme: ${p.name} — click to stop`;
  themeBarItem.show();
}
