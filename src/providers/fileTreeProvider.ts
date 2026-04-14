/**
 * fileTreeProvider.ts
 *
 * Supplies the data for the "Files" tree view shown in the Anim Explorer
 * activity-bar panel.  It reads the workspace folder synchronously (which is
 * acceptable here because VS Code's TreeDataProvider contract is synchronous
 * at the UI level) and sorts directories before files.
 *
 * Calling `refresh()` fires the change event so VS Code re-requests the
 * children — triggered whenever files are created/deleted or the workspace
 * root changes.
 */

import * as vscode from 'vscode';
import * as path   from 'path';
import * as fs     from 'fs';

// ── Folders we never want visible in the sidebar tree ────────────────────────
const IGNORED_NAMES = new Set(['node_modules', '.git', 'out', '.vscode-test']);

// ── Tree item ────────────────────────────────────────────────────────────────

/**
 * A single row in the file tree — either a file or a directory.
 *
 * Files get a click command that opens them in the editor.
 * Directories are collapsible but have no command.
 */
export class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isDirectory: boolean
  ) {
    super(resourceUri, collapsibleState);

    // Full path shown on hover so the user always knows where the file is.
    this.tooltip     = resourceUri.fsPath;
    // Show the bare extension (e.g. "ts") as the description on file rows.
    this.description = isDirectory ? '' : path.extname(resourceUri.fsPath).slice(1);

    if (isDirectory) {
      this.contextValue = 'directory';
      this.iconPath     = new vscode.ThemeIcon('folder');
    } else {
      this.contextValue = 'file';
      this.iconPath     = new vscode.ThemeIcon('file');
      // Single-clicking a file row opens it immediately.
      this.command = {
        command:   'animExplorer.openFile',
        title:     'Open File',
        arguments: [resourceUri],
      };
    }
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {

  // VS Code listens to this event to know when to refresh the tree.
  private readonly _onDidChangeTreeData =
    new vscode.EventEmitter<FileTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rootUri: vscode.Uri | undefined;

  constructor() {
    this.rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  /**
   * Signal VS Code that the tree content has changed.
   * Also re-reads the workspace root in case a folder was added or removed.
   */
  refresh(): void {
    this.rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
    this._onDidChangeTreeData.fire();
  }

  /** VS Code calls this to render a row — we just return the item as-is. */
  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Return the children for a given tree node.
   *
   * Called with `undefined` for the root level, or with a directory item
   * when the user expands a folder.  We return an empty array on any read
   * error rather than propagating exceptions into the VS Code tree widget.
   */
  getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
    const dir = element ? element.resourceUri.fsPath : this.rootUri?.fsPath;
    if (!dir) { return Promise.resolve([]); }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      // Could happen if the folder was deleted since the last refresh.
      return Promise.resolve([]);
    }

    const items = entries
      .filter((e) => !IGNORED_NAMES.has(e.name) && !e.name.startsWith('.'))
      .sort((a, b) => {
        // Directories always come before files; within each group sort by name.
        if (a.isDirectory() !== b.isDirectory()) {
          return a.isDirectory() ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((e) => {
        const uri   = vscode.Uri.file(path.join(dir, e.name));
        const isDir = e.isDirectory();
        return new FileTreeItem(
          uri,
          isDir ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
          isDir
        );
      });

    return Promise.resolve(items);
  }
}
