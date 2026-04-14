/**
 * webview.js
 *
 * Runs inside the sandboxed Anim Explorer webview — NOT in Node.js.
 * No require() / import allowed; only browser APIs and acquireVsCodeApi().
 *
 * Responsibilities:
 *   1. Render the palette-card grid and handle filter-tab clicks.
 *   2. Drive the pulse-canvas animation loop.
 *   3. Receive messages from the extension host and update the UI.
 *   4. Send user actions (button clicks, card picks) back to the host.
 *
 * Performance notes:
 *   - The canvas animation loop uses requestAnimationFrame but skips all
 *     drawing work when the browser tab is hidden (Page Visibility API).
 *     This avoids wasting CPU on a panel the user cannot see.
 *   - Palette card clicks post a single message; the extension host handles
 *     the heavy settings-write work, not this script.
 */

(function () {
  'use strict';

  // VS Code API — lets us send messages back to the extension host.
  const vscode = acquireVsCodeApi();

  // ── DOM refs ───────────────────────────────────────────────────────────────
  // Collected once at startup so we are not querying the DOM on every event.

  const activeFileEl  = document.getElementById('activeFile');
  const statLinesEl   = document.getElementById('statLinesValue');
  const statExtEl     = document.getElementById('statExtValue');
  const statThemeEl   = document.getElementById('statThemeValue');
  const selectionBox  = document.getElementById('selectionBox');
  const fileList      = document.getElementById('fileList');
  const ringProgress  = document.getElementById('ringProgress');
  const logoLetter    = document.querySelector('.logo-letter');
  const canvas        = /** @type {HTMLCanvasElement|null} */ (document.getElementById('pulseCanvas'));
  const ctx           = canvas ? canvas.getContext('2d') : null;
  const paletteGrid   = document.getElementById('paletteGrid');
  const paletteNameEl = document.getElementById('paletteName');

  // ── Global state ───────────────────────────────────────────────────────────

  /** Current accent colour — drives the canvas, ring, and glow effects. */
  let accentColor       = '#61dafb';

  /** Y-values of the last 80 pulse-line points. */
  let pulsePoints       = [];

  /** Short-lived particles spawned on spikes and colour changes. */
  let particles         = [];

  /** Frame counter used for the idle sine-drift animation. */
  let animFrame         = 0;

  /** Frame index of the last spike, used to throttle rapid spikes. */
  let lastSpike         = 0;

  /** Name of the currently highlighted palette card, or '' if none. */
  let activePaletteName = '';

  // ── Palette definitions ────────────────────────────────────────────────────
  // Kept in sync with themeAnimator.ts — if you add a palette there, add it
  // here too so the card grid stays accurate.

  const PALETTES = [
    // Dark palettes — deep backgrounds with vivid accent colours.
    { name: 'Neon Green',  type: 'dark',  accent: '#00ff88',
      preview: ['#091a0d', '#00cc6a', '#00ff88'] },
    { name: 'Neon Blue',   type: 'dark',  accent: '#00d4ff',
      preview: ['#081220', '#0099cc', '#00d4ff'] },
    { name: 'Dark Purple', type: 'dark',  accent: '#c060ff',
      preview: ['#120a1f', '#8822bb', '#c060ff'] },

    // Light palettes — bright chrome with readable dark text.
    { name: 'Soft Mint',   type: 'light', accent: '#15803d',
      preview: ['#dcfce7', '#86efac', '#15803d'] },
    { name: 'Sky Blue',    type: 'light', accent: '#1d4ed8',
      preview: ['#dbeafe', '#93c5fd', '#1d4ed8'] },
    { name: 'Lavender',    type: 'light', accent: '#7c3aed',
      preview: ['#ede9fe', '#c4b5fd', '#7c3aed'] },
    { name: 'Sunset',      type: 'light', accent: '#c2410c',
      preview: ['#fed7aa', '#fb923c', '#c2410c'] },
    { name: 'Rose Gold',   type: 'light', accent: '#be123c',
      preview: ['#fce7f3', '#f9a8d4', '#be123c'] },
  ];

  // ── Colour helpers ─────────────────────────────────────────────────────────

  /**
   * Convert a hex colour + alpha (0–1) into an rgba() CSS string.
   * Mirrors hexWithAlpha() from colors.ts — kept local to avoid any imports.
   */
  function hexWithAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Accent colour ──────────────────────────────────────────────────────────

  /**
   * Update the CSS custom properties and DOM elements that depend on the
   * accent colour.  Fires a particle burst so the colour change feels alive.
   *
   * Skips the update if `color` is identical to the current accent — useful
   * because the extension host sends the same colour while a palette is being
   * held (before the next cross-fade begins).
   */
  function applyAccent(color) {
    if (!color || color === accentColor) { return; }
    accentColor = color;

    const root = document.documentElement;
    root.style.setProperty('--accent',       accentColor);
    root.style.setProperty('--accent-alpha', hexWithAlpha(accentColor, 0.15));
    root.style.setProperty('--accent-glow',  hexWithAlpha(accentColor, 0.6));

    if (ringProgress) { ringProgress.style.stroke = accentColor; }
    if (logoLetter)   { logoLetter.style.color    = accentColor; }

    // Burst particles from the canvas centre to celebrate the colour change.
    spawnParticleBurst(
      canvas ? canvas.width  / 2 : 180,
      canvas ? canvas.height / 2 : 50,
      18
    );
  }

  // ── Palette grid ───────────────────────────────────────────────────────────

  /**
   * Rebuild the palette card grid, showing only palettes that match `filter`
   * ('all', 'dark', or 'light').
   */
  function renderPaletteGrid(filter) {
    if (!paletteGrid) { return; }
    paletteGrid.innerHTML = '';

    PALETTES
      .filter((p) => filter === 'all' || p.type === filter)
      .forEach((p) => {
        const card = document.createElement('div');
        card.className  = 'palette-card' + (p.name === activePaletteName ? ' palette-card-active' : '');
        card.dataset.name = p.name;

        // Gradient swatch — shows the palette's dark-to-light colour ramp.
        const swatch = document.createElement('div');
        swatch.className = 'card-swatch';
        swatch.style.background =
          `linear-gradient(135deg, ${p.preview[0]} 0%, ${p.preview[1]} 55%, ${p.preview[2]} 100%)`;

        const label = document.createElement('span');
        label.className   = 'card-label';
        label.textContent = p.name;

        const badge = document.createElement('span');
        badge.className   = `card-badge card-badge-${p.type}`;
        badge.textContent = p.type === 'dark' ? 'Dark' : 'Light';

        card.append(swatch, label, badge);
        paletteGrid.appendChild(card);
      });
  }

  /**
   * Mark `name` as the active palette card (adds a glowing border) and update
   * the text label below the grid.  Pass an empty string to clear the selection.
   */
  function setActivePaletteCard(name) {
    activePaletteName = name || '';

    if (paletteNameEl) {
      paletteNameEl.textContent = name || 'Click a palette to apply';
    }

    if (!paletteGrid) { return; }
    paletteGrid.querySelectorAll('.palette-card').forEach((card) => {
      card.classList.toggle('palette-card-active', card.dataset.name === name);
    });
  }

  // ── Filter tabs ────────────────────────────────────────────────────────────

  document.querySelectorAll('.ptab').forEach((tab) => {
    tab.addEventListener('click', () => {
      // Move the active indicator to the clicked tab.
      document.querySelectorAll('.ptab').forEach((t) => t.classList.remove('ptab-active'));
      tab.classList.add('ptab-active');
      renderPaletteGrid(tab.dataset.filter || 'all');
    });
  });

  // ── Palette card clicks ────────────────────────────────────────────────────

  if (paletteGrid) {
    // Single listener on the container — faster than one per card (event
    // delegation), and automatically covers cards added after initial render.
    paletteGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.palette-card');
      if (!card) { return; }

      const name = card.dataset.name;
      if (!name) { return; }

      setActivePaletteCard(name);

      // Update the canvas colour immediately for instant visual feedback.
      const palette = PALETTES.find((p) => p.name === name);
      if (palette) { applyAccent(palette.accent); }

      // Ask the extension host to write the colours to VS Code settings.
      vscode.postMessage({ type: 'applyPalette', name });
    });
  }

  // ── Particle system ────────────────────────────────────────────────────────

  /**
   * Spawn `count` particles in a full circle around (cx, cy).
   * Used when the accent colour changes — makes the transition feel dynamic.
   */
  function spawnParticleBurst(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 35 + Math.random() * 25,
        r: 2 + Math.random() * 3,
      });
    }
  }

  /**
   * Spawn a small upward burst at (x, y) — triggered by pulse spikes.
   */
  function spawnSpikeParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -(1 + Math.random() * 3),
        life: 0,
        maxLife: 25 + Math.random() * 15,
        r: 1.5 + Math.random() * 2,
      });
    }
  }

  // ── Pulse canvas ───────────────────────────────────────────────────────────

  /** Initialise the canvas size and seed the pulse-points buffer. */
  function initPulse() {
    if (!canvas || !ctx) { return; }
    canvas.width  = canvas.offsetWidth  || 360;
    canvas.height = canvas.offsetHeight || 100;
    for (let i = 0; i < 80; i++) { pulsePoints.push(canvas.height / 2); }
    requestAnimationFrame(drawPulse);
  }

  /** Append a new Y-value to the pulse buffer, dropping the oldest entry. */
  function pushPulseValue(value) {
    pulsePoints.push(value);
    if (pulsePoints.length > 80) { pulsePoints.shift(); }
  }

  /**
   * Main animation loop — runs every animation frame via requestAnimationFrame.
   *
   * Skips all canvas work when the webview tab is hidden to avoid wasting CPU.
   * The browser still calls this (RAF is throttled but not stopped when hidden)
   * so we check document.hidden explicitly.
   */
  function drawPulse() {
    // Always re-schedule first so the loop never stops, even when hidden.
    requestAnimationFrame(drawPulse);

    // Skip drawing when the tab is not visible — saves CPU for the editor.
    if (document.hidden) {
      // Still advance the frame counter so spikes stay in sync after un-hiding.
      animFrame++;
      return;
    }

    if (!ctx || !canvas) { return; }
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // ── Background grid (very faint) ───────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;
    for (let y = h * 0.25; y < h; y += h * 0.25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let x = w * 0.25; x < w; x += w * 0.25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    const step = w / (pulsePoints.length - 1);

    // ── Filled area under the curve ────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(0, h);
    pulsePoints.forEach((pt, i) => { ctx.lineTo(i * step, pt); });
    ctx.lineTo(w, h);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, hexWithAlpha(accentColor, 0.4));
    fillGrad.addColorStop(1, hexWithAlpha(accentColor, 0.0));
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // ── Glowing line on top ────────────────────────────────────────────────
    ctx.beginPath();
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = accentColor;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = accentColor;
    pulsePoints.forEach((pt, i) => {
      if (i === 0) { ctx.moveTo(0, pt); } else { ctx.lineTo(i * step, pt); }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Bright dot at the leading edge ─────────────────────────────────────
    const tipX = (pulsePoints.length - 1) * step;
    const tipY = pulsePoints[pulsePoints.length - 1];
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fillStyle   = accentColor;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = accentColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Particles ──────────────────────────────────────────────────────────
    // Filter out dead particles first, then draw and advance the rest.
    particles = particles.filter((p) => p.life < p.maxLife);
    for (const p of particles) {
      const t = p.life / p.maxLife;           // 0 = fresh, 1 = dead
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fillStyle   = hexWithAlpha(accentColor, 1 - t);
      ctx.shadowBlur  = 6;
      ctx.shadowColor = accentColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.08;    // simple gravity
      p.life += 1;
    }

    // ── Idle sine drift — gives the line life when nothing is happening ────
    animFrame++;
    const mid   = h / 2;
    const drift = mid
      + Math.sin(animFrame * 0.045) * (h * 0.18)
      + Math.sin(animFrame * 0.011) * (h * 0.07);
    pushPulseValue(drift);
  }

  // ── Spike helper ───────────────────────────────────────────────────────────

  /**
   * Push a dramatic spike into the pulse buffer.
   * Throttled to once every 8 frames so rapid events don't look spastic.
   *
   * `intensity` (0–1) — how tall the spike is; 1 = maximum height.
   */
  function triggerSpike(intensity) {
    if (!canvas) { return; }
    if (animFrame - lastSpike < 8) { return; }    // throttle
    lastSpike = animFrame;

    const spikeY = canvas.height * (0.05 + (1 - intensity) * 0.35);
    pushPulseValue(spikeY);

    const tipX = (pulsePoints.length - 1) * (canvas.width / (pulsePoints.length - 1));
    spawnSpikeParticles(tipX, spikeY);

    canvas.classList.add('active');
    setTimeout(() => canvas.classList.remove('active'), 600);
  }

  // ── Message handler ────────────────────────────────────────────────────────
  // The extension host pushes these messages whenever editor state changes.

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || !msg.type) { return; }

    switch (msg.type) {

      // A different file became active in the editor.
      case 'fileChanged': {
        if (activeFileEl) { activeFileEl.textContent = msg.fileName || ''; }
        if (statExtEl)    { statExtEl.textContent    = msg.extension || '—'; }

        applyAccent(msg.color);

        // Highlight the matching file chip in the workspace file list.
        document.querySelectorAll('.file-chip').forEach((chip) => {
          chip.classList.toggle(
            'active',
            chip.dataset.ext === msg.extension && msg.extension !== ''
          );
        });

        triggerSpike(0.85);
        break;
      }

      // The user selected (or deselected) text in the editor.
      case 'selectionChanged': {
        if (statLinesEl) {
          statLinesEl.textContent = String(msg.lineCount || 0);
        }
        document.getElementById('statLines')
          ?.classList.toggle('highlight', (msg.lineCount || 0) > 0);

        if (msg.accentColor) { applyAccent(msg.accentColor); }

        if (selectionBox) {
          if (msg.text && msg.text.length > 0) {
            // textContent is used (not innerHTML) to prevent XSS from selected code.
            selectionBox.textContent = msg.text.length > 120
              ? msg.text.slice(0, 120) + '…'
              : msg.text;
            selectionBox.classList.add('has-selection');
          } else {
            selectionBox.innerHTML =
              '<span class="selection-placeholder">Select code in the editor…</span>';
            selectionBox.classList.remove('has-selection');
          }
        }

        if ((msg.lineCount || 0) > 0) {
          triggerSpike(0.4 + Math.min((msg.lineCount || 0), 20) * 0.025);
        }
        break;
      }

      // VS Code reports whether it is running in a light or dark host theme.
      case 'theme': {
        const NAMES = ['', 'Light', 'Dark', 'High Contrast', 'HC Light'];
        if (statThemeEl) { statThemeEl.textContent = NAMES[msg.kind] || '—'; }
        break;
      }

      // The theme animator completed a palette transition.
      case 'accentChanged': {
        applyAccent(msg.accent);
        if (msg.paletteName) { setActivePaletteCard(msg.paletteName); }
        break;
      }
    }
  });

  // ── File chip click ────────────────────────────────────────────────────────

  if (fileList) {
    fileList.addEventListener('click', (e) => {
      const chip = e.target.closest('.file-chip');
      if (!chip) { return; }
      const p = chip.dataset.path;
      if (p) { vscode.postMessage({ type: 'openFile', path: p }); }
    });
  }

  // ── Button ripple effect ───────────────────────────────────────────────────
  // Single delegated listener on the document so every .action-btn gets the
  // effect automatically, including buttons added later.

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) { return; }

    const rect   = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText =
      `width:${size}px;height:${size}px;` +
      `left:${e.clientX - rect.left - size / 2}px;` +
      `top:${e.clientY  - rect.top  - size / 2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // ── Button actions ─────────────────────────────────────────────────────────

  // Clicking the THEME stat chip opens VS Code's built-in theme picker so the
  // user can switch between Dark / Light / High Contrast without leaving the panel.
  document.getElementById('statTheme')?.addEventListener('click', () =>
    vscode.postMessage({ type: 'toggleTheme' }));

  document.getElementById('btnGitStatus')?.addEventListener('click', () =>
    vscode.postMessage({ type: 'gitStatus' }));

  document.getElementById('btnGitPush')?.addEventListener('click', () =>
    vscode.postMessage({ type: 'gitPush' }));

  document.getElementById('btnSearch')?.addEventListener('click', () =>
    vscode.postMessage({ type: 'openSearch' }));

  document.getElementById('btnStartTheme')?.addEventListener('click', () => {
    setActivePaletteCard('');    // auto-cycle manages its own active state
    vscode.postMessage({ type: 'startTheme' });
  });

  document.getElementById('btnStopTheme')?.addEventListener('click', () =>
    vscode.postMessage({ type: 'stopTheme' }));

  document.getElementById('btnResetTheme')?.addEventListener('click', () => {
    setActivePaletteCard('');
    vscode.postMessage({ type: 'resetTheme' });
  });

  // ── Resize ─────────────────────────────────────────────────────────────────
  // Re-measure the canvas whenever the panel is resized so the pulse line
  // always fills the full width.

  window.addEventListener('resize', () => {
    if (!canvas) { return; }
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight || 100;
  });

  // ── Startup ────────────────────────────────────────────────────────────────

  renderPaletteGrid('all');      // build the card grid with all palettes
  initPulse();                   // start the canvas animation loop
  vscode.postMessage({ type: 'ready' });   // tell the host we are ready for data

}());
