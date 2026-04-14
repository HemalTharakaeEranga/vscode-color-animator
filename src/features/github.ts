/**
 * github.ts
 *
 * Reads Git state from VS Code's built-in git extension and surfaces it in
 * the status bar.
 *
 * We use the published Git extension API (version 1) rather than shelling out
 * to `git` directly — this is faster, works offline, and avoids spawning child
 * processes which could be a security concern in untrusted workspaces.
 */

import * as vscode from 'vscode';

// ── Git API access ────────────────────────────────────────────────────────────

/**
 * Return the name of the currently checked-out branch for the first workspace
 * repository, or `undefined` if git is unavailable or the folder has no repo.
 *
 * This is intentionally non-throwing — a missing git extension should never
 * break the rest of the extension.
 */
export async function getCurrentBranch(): Promise<string | undefined> {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) { return undefined; }

  try {
    // Activate the git extension if it hasn't started yet.
    const git = gitExtension.isActive
      ? gitExtension.exports
      : await gitExtension.activate();

    const api  = git.getAPI(1);
    const repo = api.repositories[0];
    return repo?.state.HEAD?.name;
  } catch {
    // Git extension failed to activate (e.g. no git binary installed).
    return undefined;
  }
}

// ── Status bar item ───────────────────────────────────────────────────────────

/**
 * Register a status bar item that shows the active git branch and opens the
 * Anim Explorer panel when clicked.
 *
 * The item is pushed onto `context.subscriptions` so VS Code disposes it
 * automatically when the extension deactivates.
 */
export function registerStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
  const showBar = vscode.workspace
    .getConfiguration('animExplorer')
    .get<boolean>('showStatusBar', true);

  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'animExplorer.openPanel';
  item.text    = '$(pulse) Anim Explorer';
  item.tooltip = 'Click to open Anim Explorer panel';

  if (showBar) { item.show(); }
  context.subscriptions.push(item);

  // Fetch the current branch asynchronously so we don't block extension
  // activation.  The label updates once the promise resolves.
  getCurrentBranch().then((branch) => {
    if (branch) {
      item.text = `$(git-branch) ${branch}  $(pulse) Anim`;
    }
  }).catch(() => {
    // Branch lookup failed — leave the default label in place.
  });

  // Keep the branch label up to date whenever HEAD changes (e.g. after a
  // checkout).  We only set this listener up if the git extension is present.
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (gitExtension) {
    // Wrap in Promise.resolve so we always get a real Promise (activate()
    // returns PromiseLike which lacks .catch()).
    const activate = Promise.resolve(
      gitExtension.isActive ? gitExtension.exports : gitExtension.activate()
    );

    activate.then((git) => {
      const api  = git.getAPI(1);
      const repo = api.repositories[0];
      if (!repo) { return; }

      context.subscriptions.push(
        repo.state.onDidChange(() => {
          const name = repo.state.HEAD?.name;
          item.text  = name
            ? `$(git-branch) ${name}  $(pulse) Anim`
            : '$(pulse) Anim Explorer';
        })
      );
    }).catch(() => {
      // Git extension failed — status bar keeps its default text.
    });
  }

  return item;
}
