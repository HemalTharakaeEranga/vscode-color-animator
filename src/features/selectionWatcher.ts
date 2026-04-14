/**
 * selectionWatcher.ts
 *
 * Watches for two kinds of editor events and forwards them to the webview:
 *   1. Active-editor changes  (user switches files)
 *   2. Selection changes      (user highlights code)
 *
 * Both events can fire extremely rapidly — every cursor move triggers a
 * selection event.  Sending a webview message on every single event would
 * flood the IPC channel and make the panel feel laggy.  We debounce the
 * selection notifications so only the final state after 80 ms of quiet is sent.
 */

import * as vscode from 'vscode';
import { applySelectionDecoration, clearDecorations } from './decorations';
import { AnimationViewProvider } from '../providers/animationViewProvider';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read the accent colour from workspace configuration.
 * Falls back to a neutral cyan if the user hasn't set one.
 */
function getAccentColor(): string {
  return vscode.workspace
    .getConfiguration('animExplorer')
    .get<string>('accentColor', '#61dafb');
}

/**
 * Returns a debounced wrapper around `fn`.
 * Only calls `fn` after `delayMs` milliseconds of silence.
 * Any call within the quiet window resets the timer.
 */
function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * Register all editor event listeners for this extension.
 *
 * All listeners are pushed onto `context.subscriptions` so VS Code disposes
 * them automatically when the extension is deactivated.
 */
export function registerSelectionWatcher(
  context: vscode.ExtensionContext,
  animProvider: AnimationViewProvider
): void {

  // ── 1. File switch — tell the webview which file is now open ──────────────
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Always wipe the highlight when switching files; the previous selection
      // belongs to a different document and the decoration would look orphaned.
      clearDecorations(editor);

      if (!editor) { return; }

      animProvider.notifyFileChanged(editor.document.uri, getAccentColor());
    })
  );

  // ── 2. Selection change — debounced so we don't flood the webview ─────────
  //
  // The decoration is applied immediately (visual feedback matters here), but
  // the webview message is debounced — the panel only updates after the user
  // pauses for 80 ms.  This halves the IPC traffic during typical typing.
  const notifySelectionDebounced = debounce(
    (text: string, lineCount: number, accent: string) => {
      animProvider.notifySelection(text, lineCount, accent);
    },
    80
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const editor    = event.textEditor;
      const selection = editor.selection;
      const accent    = getAccentColor();

      if (selection.isEmpty) {
        // Selection cleared — remove highlight immediately and notify panel.
        clearDecorations(editor);
        animProvider.notifySelection('', 0, accent);
        return;
      }

      // Apply the coloured highlight right away so it feels instant.
      applySelectionDecoration(editor, accent);

      // Debounce the webview message: wait for the user to stop moving.
      const selectedText = editor.document.getText(selection);
      const lineCount    = Math.abs(selection.end.line - selection.start.line) + 1;
      notifySelectionDebounced(selectedText, lineCount, accent);
    })
  );

  // ── 3. Initial state — handle a file that is already open on activation ───
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    animProvider.notifyFileChanged(activeEditor.document.uri, getAccentColor());
  }
}
