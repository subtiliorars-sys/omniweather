/**
 * OmniWeather — DataLayerManager
 *
 * Central registry for all weather data layers. Each layer registers
 * itself with a fetch function, cache TTL, and source metadata.
 * The manager handles refresh scheduling, cache invalidation,
 * and provides a unified getStats() for the HUD.
 */

const LIFECYCLE = Object.freeze({
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  NOMINAL: 'NOMINAL',
  DEGRADED: 'DEGRADED',
  STALE: 'STALE',
  FALLBACK: 'FALLBACK',
  UNAVAILABLE: 'UNAVAILABLE',
});

class DataLayerManager {
  constructor() {
    this.layers = new Map();
    this.cache = new Map();
    this.refreshTimers = new Map();
  }

  /**
   * Register a data layer.
   * @param {string} id — unique layer identifier
   * @param {object} config
   * @param {Function} config.fetch — async () => data
   * @param {number} config.cacheTTL — ms before cache is stale
   * @param {string} config.source — human-readable source name
   * @param {string} config.license — data license terms
   * @param {boolean} config.enabled — start enabled?
   */
  register(id, { fetch, cacheTTL, source, license, enabled = true }) {
    this.layers.set(id, {
      id,
      fetch,
      cacheTTL,
      source,
      license,
      enabled,
      stats: { status: LIFECYCLE.IDLE, count: 0, lastUpdate: null, error: null },
    });
    if (enabled) this.refresh(id);
  }

  /** Fetch layer data, update cache and stats. */
  async refresh(id) {
    const layer = this.layers.get(id);
    if (!layer || !layer.enabled) return;

    layer.stats.status = LIFECYCLE.LOADING;
    try {
      const data = await layer.fetch();
      this.cache.set(id, { data, fetchedAt: Date.now() });
      layer.stats.status = LIFECYCLE.NOMINAL;
      layer.stats.count = Array.isArray(data) ? data.length : 1;
      layer.stats.lastUpdate = new Date().toISOString();
      layer.stats.error = null;
    } catch (err) {
      layer.stats.status = LIFECYCLE.DEGRADED;
      layer.stats.error = err.message;
      console.warn(`[OmniWeather] Layer ${id} refresh failed:`, err.message);
    }
  }

  /** Get cached data for a layer, null if absent/stale. */
  getData(id) {
    const entry = this.cache.get(id);
    const layer = this.layers.get(id);
    if (!entry || !layer) return null;
    if (Date.now() - entry.fetchedAt > layer.cacheTTL) {
      layer.stats.status = LIFECYCLE.STALE;
      return null;
    }
    return entry.data;
  }

  /** Get stats for a single layer or all layers. */
  getStats(id = null) {
    if (id) return this.layers.get(id)?.stats ?? null;
    const out = {};
    for (const [key, layer] of this.layers) out[key] = layer.stats;
    return out;
  }

  /** Enable or disable a layer and trigger refresh if enabling. */
  setEnabled(id, enabled) {
    const layer = this.layers.get(id);
    if (!layer) return;
    layer.enabled = enabled;
    if (enabled) this.refresh(id);
  }

  /** Start periodic refresh for a layer. */
  startAutoRefresh(id, intervalMs = null) {
    const layer = this.layers.get(id);
    if (!layer) return;
    this.stopAutoRefresh(id);
    const ttl = intervalMs ?? layer.cacheTTL;
    this.refreshTimers.set(id, setInterval(() => this.refresh(id), ttl));
  }

  stopAutoRefresh(id) {
    const timer = this.refreshTimers.get(id);
    if (timer) { clearInterval(timer); this.refreshTimers.delete(id); }
  }
}

// Singleton — import this everywhere
export const dataManager = new DataLayerManager();
export default dataManager;
