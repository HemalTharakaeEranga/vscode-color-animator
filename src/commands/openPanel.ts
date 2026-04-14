/**
 * openPanel.ts
 *
 * Registers the command that opens (or focuses) the Anim Explorer webview
 * panel.  Kept in its own file so the command wiring stays separate from the
 * provider logic and is easy to find.
 */

import * as vscode from 'vscode';
import { AnimationViewProvider } from '../providers/animationViewProvider';

/**
 * Register `animExplorer.openPanel` with VS Code.
 *
 * The command is pushed onto `context.subscriptions` so it is automatically
 * unregistered when the extension deactivates.
 */
export function registerOpenPanelCommand(
  context: vscode.ExtensionContext,
  animProvider: AnimationViewProvider
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('animExplorer.openPanel', () => {
      animProvider.openOrReveal(context);
    })
  );
}
