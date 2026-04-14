/**
 * decorations.ts
 *
 * Applies a coloured highlight to whatever text the user has selected in the
 * active editor.  The decoration type is cached so we only create a new VS Code
 * decoration object when the accent colour actually changes — creating one on
 * every selection event would leak memory and slow things down noticeably.
 */

import * as vscode from 'vscode';
import { hexWithAlpha } from '../utils/colors';

// ── Cached state ─────────────────────────────────────────────────────────────

/** The active decoration type.  Re-created only when the accent colour changes. */
let decorationType: vscode.TextEditorDecorationType | undefined;

/**
 * The accent colour that was used to build `decorationType`.
 * We compare against this before deciding whether to recreate.
 */
let cachedAccent: string | undefined;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Highlight the current selection in `editor` using `accentColor`.
 *
 * Performance note: the TextEditorDecorationType is cached and reused across
 * calls.  It is only disposed and recreated when `accentColor` changes, which
 * keeps the cost of rapid cursor-movement events very low.
 */
export function applySelectionDecoration(
  editor: vscode.TextEditor,
  accentColor: string
): void {
  const selection = editor.selection;

  // Nothing selected — wipe any existing highlight and bail out early.
  if (selection.isEmpty) {
    clearDecorations(editor);
    return;
  }

  // Rebuild the decoration type only when the accent colour has changed.
  // Creating a new TextEditorDecorationType is expensive (it round-trips to the
  // extension host), so we avoid doing it on every keystroke.
  if (!decorationType || accentColor !== cachedAccent) {
    decorationType?.dispose();       // free the old one first
    cachedAccent   = accentColor;
    decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor:   hexWithAlpha(accentColor, 0.12),
      borderRadius:      '3px',
      overviewRulerColor: accentColor,
      overviewRulerLane:  vscode.OverviewRulerLane.Right,
      // Slightly different opacities so it looks good in both light/dark themes
      light: { backgroundColor: hexWithAlpha(accentColor, 0.10) },
      dark:  { backgroundColor: hexWithAlpha(accentColor, 0.15) },
    });
  }

  // Apply the highlight.  Calling setDecorations with a new range list is cheap
  // because the underlying type object is already registered with VS Code.
  editor.setDecorations(decorationType, [
    new vscode.Range(selection.start, selection.end),
  ]);
}

/**
 * Remove the selection highlight from `editor`.
 *
 * We pass an empty range list instead of disposing the type so the type stays
 * alive for the next selection event — disposal is reserved for colour changes.
 */
export function clearDecorations(editor?: vscode.TextEditor): void {
  if (decorationType && editor) {
    editor.setDecorations(decorationType, []);
  }
}

/**
 * Fully dispose the cached decoration type.
 * Call this when the extension is deactivated or the accent colour is removed.
 */
export function disposeDecorations(): void {
  decorationType?.dispose();
  decorationType = undefined;
  cachedAccent   = undefined;
}
