/**
 * OmniWeather — UI Shell (HUD)
 *
 * Lean overlay for the 3D globe:
 * - Layer toggle chips (radar, satellite, forecast models)
 * - Free/paid tier gate banner
 * - Archive rewind controls (premium)
 * - Current conditions panel
 */

import { dataManager } from '../data/manager.js';

export function buildHUD(viewer) {
  const container = document.createElement('div');
  container.id = 'omni-hud';
  container.innerHTML = `
    <div id="omni-tier-banner" class="omni-tier-free">
      FREE TIER — 2h rewind limit
      <button id="omni-upgrade-btn">Upgrade → Premium</button>
    </div>
    <div id="omni-layer-chips">
      <button class="omni-chip active" data-layer="radar">NEXRAD Radar</button>
      <button class="omni-chip active" data-layer="satellite">GOES Sat</button>
      <button class="omni-chip" data-layer="gfs">GFS Forecast</button>
      <button class="omni-chip" data-layer="hrrr">HRRR</button>
      <button class="omni-chip" data-layer="nam">NAM</button>
    </div>
    <div id="omni-rewind" class="omni-rewind-premium" style="display:none">
      <button id="omni-rewind-back">⏪</button>
      <span id="omni-rewind-time">0h 0m</span>
      <button id="omni-rewind-fwd">⏩</button>
    </div>
    <div id="omni-conditions"></div>
  `;
  document.body.appendChild(container);

  // Wire layer toggles
  container.querySelectorAll('.omni-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const layer = chip.dataset.layer;
      const active = chip.classList.toggle('active');
      dataManager.setEnabled(layer, active);
    });
  });

  // Upgrade button opens subscription flow
  container.querySelector('#omni-upgrade-btn')?.addEventListener('click', () => {
    window.__omniweather?.openSubscription?.();
  });

  return container;
}

/** Update the conditions panel with current data. */
export function updateConditions(stats) {
  const panel = document.getElementById('omni-conditions');
  if (!panel) return;
  const entries = Object.entries(stats || {});
  if (entries.length === 0) { panel.innerHTML = '<span class="omni-condition">No data</span>'; return; }
  panel.innerHTML = entries.map(([id, s]) =>
    `<span class="omni-condition ${s.status.toLowerCase()}">${id}: ${s.status}</span>`
  ).join(' | ');
}

/** Show/hide the premium rewind controls. */
export function setPremium(enabled) {
  const rewind = document.getElementById('omni-rewind');
  if (rewind) rewind.style.display = enabled ? 'flex' : 'none';
  const banner = document.getElementById('omni-tier-banner');
  if (banner) banner.textContent = enabled ? 'PREMIUM — 5-10h archive' : 'FREE TIER — 2h rewind limit';
}

export default { buildHUD, updateConditions, setPremium };
