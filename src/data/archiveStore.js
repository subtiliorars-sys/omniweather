/**
 * OmniWeather — SQLite Archive Store (V1)
 *
 * Uses sql.js (SQLite compiled to WASM) for zero-server local storage
 * in the Tauri desktop bundle. Stores radar/satellite snapshots and
 * forecast model outputs for the 5-10h premium rewind feature.
 *
 * V1 schema:
 *   archive_events — timestamped weather data snapshots
 *   archive_metadata — layer config, retention policy, tier gating
 */

import { SQL } from 'sql.js';

const DB_NAME = 'omniweather.db';
const MAX_FREE_STATES = 24; // 24 × 5min = 2h free tier
const MAX_PREMIUM_STATES = 120; // 120 × 5min = 10h premium

export class ArchiveStore {
  constructor() {
    this.db = null;
    this.tier = 'free'; // 'free' | 'premium'
  }

  async init() {
    // Load sql.js WASM — in Tauri the binary is bundled via include
    const SQLModule = await SQL({
      locateFile: (file) => `./node_modules/sql.js/dist/${file}`,
    });
    this.db = new SQLModule.Database();
    this._createTables();
  }

  _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS archive_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        layer TEXT NOT NULL,
        data BLOB NOT NULL,
        metadata TEXT
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS archive_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    // Seed defaults
    this.db.run(`INSERT OR REPLACE INTO archive_metadata (key, value) VALUES ('tier', 'free')`);
    this.db.run(`INSERT OR REPLACE INTO archive_metadata (key, value) VALUES ('max_states', '24')`);
  }

  /** Save a weather snapshot to the archive. */
  save(layer, data, metadata = {}) {
    const now = Date.now();
    const stmt = this.db.prepare(
      'INSERT INTO archive_events (timestamp, layer, data, metadata) VALUES (?, ?, ?, ?)'
    );
    stmt.bind([now, layer, JSON.stringify(data), JSON.stringify(metadata)]);
    stmt.step();
    stmt.free();
    // Enforce retention based on tier
    this._enforceRetention();
    return now;
  }

  /** Load snapshots for a layer within a time range. */
  load(layer, fromMs = null, toMs = null) {
    const now = Date.now();
    fromMs = fromMs ?? (now - 2 * 60 * 60 * 1000); // default 2h
    toMs = toMs ?? now;
    const stmt = this.db.prepare(
      'SELECT * FROM archive_events WHERE layer = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC'
    );
    stmt.bind([layer, fromMs, toMs]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  /** Set the subscription tier and enforce retention limits. */
  setTier(tier) {
    this.tier = tier;
    const maxStates = tier === 'premium' ? MAX_PREMIUM_STATES : MAX_FREE_STATES;
    this.db.run('INSERT OR REPLACE INTO archive_metadata (key, value) VALUES (?, ?)', ['tier', tier]);
    this.db.run('INSERT OR REPLACE INTO archive_metadata (key, value) VALUES (?, ?)', ['max_states', String(maxStates)]);
    this._enforceRetention();
  }

  getTier() {
    const row = this.db.exec("SELECT value FROM archive_metadata WHERE key = 'tier'");
    return row[0]?.values?.[0]?.[0] ?? 'free';
  }

  getStats() {
    const tier = this.getTier();
    const maxStates = tier === 'premium' ? MAX_PREMIUM_STATES : MAX_FREE_STATES;
    const count = this.db.exec("SELECT COUNT(*) as c FROM archive_events")[0]?.values?.[0]?.[0] ?? 0;
    return { tier, maxStates, currentCount: count, historyHours: (maxStates * 5) / 60 };
  }

  _enforceRetention() {
    const maxStates = this.getTier() === 'premium' ? MAX_PREMIUM_STATES : MAX_FREE_STATES;
    const count = this.db.exec("SELECT COUNT(*) as c FROM archive_events")[0]?.values?.[0]?.[0] ?? 0;
    if (count <= maxStates) return;
    const excess = count - maxStates;
    this.db.run('DELETE FROM archive_events WHERE id IN (SELECT id FROM archive_events ORDER BY timestamp ASC LIMIT ?)', [excess]);
  }
}

export default ArchiveStore;
