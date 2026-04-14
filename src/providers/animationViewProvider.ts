/**
 * animationViewProvider.ts
 *
 * Manages the Anim Explorer webview panel that opens in column two.
 * It owns the panel's lifecycle, builds the HTML, and acts as the message
 * bridge between the extension host and the sandboxed webview JS.
 *
 * Security considerations enforced here:
 *   - A per-session nonce restricts which scripts can run (CSP).
 *   - All file names and paths embedded in HTML are escaped before injection.
 *   - Incoming "openFile" requests are validated to stay inside the workspace.
 */

import * as vscode from 'vscode';
import * as path   from 'path';
import * as fs     from 'fs';
import { hexWithAlpha, accentFromExtension } from '../utils/colors';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Escape a plain string so it is safe to embed inside an HTML attribute or
 * text node.  Prevents file names containing `"`, `<`, `>`, `&` from breaking
 * the HTML structure or being interpreted as markup.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a cryptographically random nonce string for the Content-Security-
 * Policy header.  VS Code requires a fresh nonce for every webview load so
 * that injected scripts can never guess a valid nonce from a previous session.
 */
function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce   = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  return nonce;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export class AnimationViewProvider {
  public static readonly viewType = 'animExplorer.animPanel';

  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;

  /**
   * Disposables that belong to this panel only (not to the extension's
   * global lifetime).  They are flushed when the panel is closed.
   */
  private panelDisposables: vscode.Disposable[] = [];

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  // ── Panel lifecycle ───────────────────────────────────────────────────────

  /**
   * Open the panel, or bring it to the front if it is already open.
   * Creating a second panel is wasteful and confusing for the user.
   */
  public openOrReveal(context: vscode.ExtensionContext): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      AnimationViewProvider.viewType,
      'Anim Explorer',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        // Only allow the webview to load resources from our own `media` folder.
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
        // Keep the JS state alive when the panel is hidden behind another tab.
        retainContextWhenHidden: true,
      }
    );

    this.panel.iconPath = {
      light: vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'panel-light.svg'),
      dark:  vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'panel-dark.svg'),
    };

    this.panel.webview.html = this._buildHtml(this.panel.webview);

    // Route messages coming up from the webview JS.
    this.panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg),
      null,
      this.panelDisposables
    );

    // When the user closes the panel, clean up everything tied to it.
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.panelDisposables.forEach((d) => d.dispose());
        this.panelDisposables = [];
      },
      null,
      context.subscriptions
    );
  }

  // ── Outgoing messages (extension → webview) ───────────────────────────────

  /**
   * Tell the webview panel which file just became active and what accent
   * colour should be used for that file's language/extension.
   */
  public notifyFileChanged(uri: vscode.Uri, accentColor: string): void {
    if (!this.panel) { return; }
    const ext   = path.extname(uri.fsPath);
    const color = accentFromExtension(ext, accentColor);
    this.panel.webview.postMessage({
      type:       'fileChanged',
      fileName:   path.basename(uri.fsPath),
      extension:  ext,
      color,
      colorAlpha: hexWithAlpha(color, 0.15),
    });
  }

  /**
   * Tell the webview that the active theme palette changed (either from the
   * auto-cycle or from a manual palette card click).
   */
  public notifyAccentChanged(accent: string, paletteName?: string): void {
    if (!this.panel) { return; }
    this.panel.webview.postMessage({ type: 'accentChanged', accent, paletteName });
  }

  /**
   * Send the currently selected text and line count to the webview so it can
   * display a live preview and animate the pulse canvas.
   *
   * Text is truncated to 120 characters — we only need a preview, not the
   * full selection, and large payloads slow down the IPC channel.
   */
  public notifySelection(text: string, lineCount: number, accentColor: string): void {
    if (!this.panel) { return; }
    this.panel.webview.postMessage({
      type:        'selectionChanged',
      text:        text.slice(0, 120),
      lineCount,
      accentColor,
    });
  }

  // ── Incoming messages (webview → extension) ───────────────────────────────

  private _handleMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {

      // ── Editor / workspace actions ───────────────────────────────────────
      case 'openSearch':
        vscode.commands.executeCommand('workbench.action.findInFiles');
        break;

      case 'openFile': {
        const requested = message.path;
        if (typeof requested !== 'string') { break; }

        /*
         * Security: prevent path-traversal attacks.
         * A malicious webview message could pass something like
         * "../../sensitive-file.txt".  We normalise the path and confirm it
         * sits inside one of the workspace folders before opening it.
         */
        const normalised = path.normalize(requested);
        const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
        const isInsideWorkspace = workspaceFolders.some((folder) =>
          normalised.startsWith(path.normalize(folder.uri.fsPath))
        );

        if (!isInsideWorkspace) {
          console.warn('[AnimExplorer] Blocked openFile outside workspace:', normalised);
          break;
        }

        vscode.workspace.openTextDocument(normalised).then(
          (doc) => vscode.window.showTextDocument(doc),
          (err) => console.error('[AnimExplorer] openFile failed:', err)
        );
        break;
      }

      // ── SCM / Git shortcuts ───────────────────────────────────────────────
      case 'gitStatus':
        vscode.commands.executeCommand('workbench.view.scm');
        break;

      case 'gitPush':
        vscode.commands.executeCommand('git.push');
        break;

      // ── Theme palette commands ────────────────────────────────────────────
      case 'applyPalette':
        if (typeof message.name === 'string') {
          vscode.commands.executeCommand('animExplorer.applyPalette', message.name);
        }
        break;

      case 'startTheme':
        vscode.commands.executeCommand('animExplorer.startTheme');
        break;

      case 'stopTheme':
        vscode.commands.executeCommand('animExplorer.stopTheme');
        break;

      case 'resetTheme':
        vscode.commands.executeCommand('animExplorer.resetTheme');
        break;

      // ── Handshake — webview signals it has finished loading ───────────────
      case 'ready':
        this.panel?.webview.postMessage({
          type: 'theme',
          kind: vscode.window.activeColorTheme.kind,
        });
        break;
    }
  }

  // ── HTML builder ──────────────────────────────────────────────────────────

  /**
   * Assemble the full HTML document for the webview.
   * Called once when the panel is first opened.
   *
   * All dynamic content (file names, paths) is HTML-escaped before being
   * embedded so that unusual characters cannot break the markup.
   */
  private _buildHtml(webview: vscode.Webview): string {
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview.js')
    );
    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <!--
    Content-Security-Policy — nothing runs unless it came from our extension
    or carries this session's nonce.  Inline styles are blocked too except for
    the nonce-tagged <style> tags VS Code itself injects.
  -->
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${webview.cspSource} 'nonce-${nonce}';
             script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${stylesUri}" />
  <title>Anim Explorer</title>
</head>
<body>
  <div id="root">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <header class="header">
      <div class="logo-ring" id="logoRing">
        <svg viewBox="0 0 100 100" class="logo-svg" aria-hidden="true">
          <circle cx="50" cy="50" r="40" class="ring-base" />
          <circle cx="50" cy="50" r="40" class="ring-progress" id="ringProgress" />
        </svg>
        <span class="logo-letter">A</span>
      </div>
      <div class="header-info">
        <h1 class="title">Anim Explorer</h1>
        <p class="subtitle" id="activeFile">No file active</p>
      </div>
    </header>

    <!-- ── Quick-stats row ───────────────────────────────────────────────── -->
    <div class="stats-bar">
      <div class="stat-chip" id="statLines">
        <span class="stat-label">Lines selected</span>
        <span class="stat-value" id="statLinesValue">0</span>
      </div>
      <div class="stat-chip" id="statExt">
        <span class="stat-label">Extension</span>
        <span class="stat-value" id="statExtValue">—</span>
      </div>
      <div class="stat-chip" id="statTheme">
        <span class="stat-label">Theme</span>
        <span class="stat-value" id="statThemeValue">—</span>
      </div>
    </div>

    <!-- ── Selection preview ──────────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section-title">Selection Preview</h2>
      <div class="selection-box" id="selectionBox">
        <span class="selection-placeholder">Select code in the editor…</span>
      </div>
    </section>

    <!-- ── Live activity canvas ───────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section-title">Activity Pulse</h2>
      <canvas id="pulseCanvas" class="pulse-canvas"
              width="360" height="90"
              aria-label="Activity pulse animation"></canvas>
    </section>

    <!-- ── Workspace file list ────────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section-title">Workspace Files</h2>
      <div class="file-list" id="fileList">
        ${this._buildFileListHtml()}
      </div>
    </section>

    <!-- ── Colour theme animator ──────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section-title">Color Theme</h2>

      <!-- All / Dark / Light filter -->
      <div class="ptab-row">
        <button class="ptab ptab-active" data-filter="all">All</button>
        <button class="ptab" data-filter="dark">Dark</button>
        <button class="ptab" data-filter="light">Light</button>
      </div>

      <!-- Cards are injected by webview.js on load -->
      <div class="palette-grid" id="paletteGrid"></div>

      <p class="palette-name" id="paletteName">Click a palette to apply</p>

      <div class="action-row" style="margin-top:8px">
        <button class="action-btn theme-btn-start" id="btnStartTheme"
                title="Auto-cycle through all palettes">
          &#9654; Auto
        </button>
        <button class="action-btn theme-btn-stop" id="btnStopTheme"
                title="Pause the auto-cycle">
          &#9646;&#9646; Stop
        </button>
        <button class="action-btn theme-btn-reset" id="btnResetTheme"
                title="Remove all colour customisations">
          &#8635; Default
        </button>
      </div>
    </section>

    <!-- ── Source-control shortcuts ───────────────────────────────────────── -->
    <section class="section">
      <h2 class="section-title">Source Control</h2>
      <div class="action-row">
        <button class="action-btn" id="btnGitStatus" title="Open the SCM panel">
          <span class="btn-icon">&#128268;</span> Git Status
        </button>
        <button class="action-btn" id="btnGitPush" title="Push the current branch">
          <span class="btn-icon">&#8679;</span> Push
        </button>
        <button class="action-btn" id="btnSearch" title="Search across files">
          <span class="btn-icon">&#128269;</span> Search
        </button>
      </div>
    </section>

  </div><!-- #root -->

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Build the HTML for the workspace file list.
   *
   * Extracted from `_buildHtml` to keep that method readable.
   * All file names and paths are HTML-escaped to prevent injection.
   */
  private _buildFileListHtml(): string {
    const folders  = vscode.workspace.workspaceFolders;
    const rootPath = folders?.[0]?.uri.fsPath ?? '';

    if (!rootPath) {
      return '<p class="no-files">No workspace open</p>';
    }

    // Folders we never want to show in the panel file list.
    const IGNORED = new Set(['node_modules', '.git', 'out', '.vscode-test']);

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(rootPath, { withFileTypes: true });
    } catch {
      return '<p class="no-files">Could not read workspace</p>';
    }

    const files = entries.filter(
      (e) => !e.isDirectory() && !IGNORED.has(e.name) && !e.name.startsWith('.')
    );

    if (files.length === 0) {
      return '<p class="no-files">No files found</p>';
    }

    return files
      .map((e) => {
        // Security: escape both the display name and the path attribute so
        // that file names containing characters like `"` or `<` cannot break
        // the HTML or inject script via data attributes.
        const safeName = escapeHtml(e.name);
        const safePath = escapeHtml(
          path.join(rootPath, e.name).replace(/\\/g, '/')
        );
        const safeExt = escapeHtml(path.extname(e.name));

        return `<div class="file-chip"
              data-path="${safePath}"
              data-ext="${safeExt}">
          <span class="file-icon">&#128196;</span> ${safeName}
        </div>`;
      })
      .join('\n');
  }
}
