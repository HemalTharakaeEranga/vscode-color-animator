/**
 * extension.ts
 *
 * Entry point for the Anim Explorer VS Code extension.
 *
 * `activate` wires up every feature in one place:
 *   - Sidebar file tree
 *   - Webview panel (AnimationViewProvider)
 *   - Selection watcher + decorations
 *   - Status bar item (git branch)
 *   - Theme colour animation commands
 *   - File-system watcher (keeps the tree in sync)
 *
 * Everything that needs cleanup is pushed onto `context.subscriptions`.
 * VS Code calls `dispose()` on each item when the extension is deactivated,
 * so we never need to manually tear anything down in `deactivate()`.
 */

import * as vscode from 'vscode';
import { AnimationViewProvider }  from './providers/animationViewProvider';
import { FileTreeProvider }        from './providers/fileTreeProvider';
import { registerOpenPanelCommand } from './commands/openPanel';
import { registerSelectionWatcher } from './features/selectionWatcher';
import { disposeDecorations }       from './features/decorations';
import { registerStatusBar }        from './features/github';
import {
  startThemeAnimation,
  stopThemeAnimation,
  resetTheme,
  applyPaletteByName,
} from './features/themeAnimator';

// ── Activate ──────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {

  // ── Core providers ─────────────────────────────────────────────────────────
  const animProvider     = new AnimationViewProvider(context.extensionUri);
  const fileTreeProvider = new FileTreeProvider();

  // Sidebar tree view — "Files" section in the Anim Explorer activity bar.
  const treeView = vscode.window.createTreeView('animExplorer.fileTree', {
    treeDataProvider: fileTreeProvider,
    showCollapseAll:  false,   // disabled — prevents duplicate-looking icon next to refresh
  });
  context.subscriptions.push(treeView);

  // Auto-open the webview panel whenever the user clicks the activity bar icon.
  context.subscriptions.push(
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        animProvider.openOrReveal(context);
      }
    })
  );

  // ── Commands ────────────────────────────────────────────────────────────────

  // Open / focus the webview panel.
  registerOpenPanelCommand(context, animProvider);

  // Manually refresh the sidebar tree.
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.refreshFileTree', () => {
      fileTreeProvider.refresh();
    })
  );

  // Open a file from the sidebar tree (argument is a Uri).
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.openFile', (uri: vscode.Uri) => {
      vscode.workspace.openTextDocument(uri).then(
        (doc) => vscode.window.showTextDocument(doc),
        (err) => console.error('[AnimExplorer] Failed to open file:', err)
      );
    })
  );

  // ── Theme animation commands ────────────────────────────────────────────────

  // Start the automatic palette cycle (all 8 palettes, smooth cross-fades).
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.startTheme', () => {
      startThemeAnimation(context, (accent, name) => {
        // Each time the animator moves to a new palette it fires this callback
        // so the webview panel can update its canvas colour and highlight the
        // active palette card.
        animProvider.notifyAccentChanged(accent, name);
      });
      vscode.window.showInformationMessage('Anim Theme: colour animation started.');
    })
  );

  // Pause the cycle — keeps the current palette applied.
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.stopTheme', () => {
      stopThemeAnimation();
      vscode.window.showInformationMessage('Anim Theme: animation paused.');
    })
  );

  // Remove all colour customisations and restore VS Code's defaults.
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.resetTheme', () => {
      resetTheme();
      animProvider.notifyReset();
      vscode.window.showInformationMessage('Anim Theme: colours reset to default.');
    })
  );

  // Apply a specific named palette immediately (used by palette card clicks).
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.applyPalette', (name: string) => {
      applyPaletteByName(name, (accent, paletteName) => {
        animProvider.notifyAccentChanged(accent, paletteName);
      });
    })
  );

  // ── Features ────────────────────────────────────────────────────────────────

  // Keep the "Theme ↗" stat chip in the webview in sync whenever the user
  // switches between Dark / Light / High Contrast themes.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme((theme) => {
      animProvider.notifyThemeKind(theme.kind);
    })
  );

  // Watch active editor and text selection changes, forward to the webview.
  registerSelectionWatcher(context, animProvider);

  // Status bar item showing the current git branch.
  registerStatusBar(context);

  // ── Workspace / file-system watchers ────────────────────────────────────────

  // Re-read the root when the user adds or removes workspace folders.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => fileTreeProvider.refresh())
  );

  // Keep the sidebar tree up to date when files are created or deleted.
  // We ignore modification events (`true`) because those don't change the tree.
  const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*', false, true, false);
  context.subscriptions.push(
    fsWatcher,
    fsWatcher.onDidCreate(() => fileTreeProvider.refresh()),
    fsWatcher.onDidDelete(() => fileTreeProvider.refresh())
  );
}

// ── Deactivate ────────────────────────────────────────────────────────────────

export function deactivate(): void {
  // Explicitly dispose the cached decoration type so VS Code can free the
  // associated resources.  Everything else is handled by context.subscriptions.
  disposeDecorations();
}
