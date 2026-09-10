/**
 * OmniWeather — Cesium Radar & Satellite Overlay Layers
 *
 * Renders NEXRAD radar mosaics and GOES satellite imagery
 * as Cesium ImageryLayers on the globe.
 * Includes a time-slider controller for the archive rewind feature.
 */

import { dataManager } from './manager.js';
import { getRadarTileUrl, getSatelliteTileUrl } from './noaaFetcher.js';

const RADAR_LAYER_ID = 'nexrad-radar';
const SAT_LAYER_ID = 'goes-satellite';

/**
 * Add NEXRAD radar mosaic as an imagery layer on the Cesium globe.
 * @param {Cesium.Viewer} viewer
 * @param {number[]} bbox - [west, south, east, north]
 * @returns {Cesium.ImageryLayer}
 */
export function addRadarOverlay(viewer, bbox = [-125, 24, -66, 50]) {
  const tileUrl = getRadarTileUrl(bbox);
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: tileUrl,
    maximumLevel: 10,
    credit: new Cesium.Credit('NEXRAD Radar (NOAA)', false),
  });
  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.name = RADAR_LAYER_ID;
  layer.show = true;
  layer.alpha = 0.7;

  dataManager.register(RADAR_LAYER_ID, {
    fetch: () => ({ tileUrl, bbox }),
    cacheTTL: 300000, // 5 min
    source: 'NOAA NEXRAD',
    license: 'public domain (NOAA)',
    enabled: true,
  });

  return layer;
}

/**
 * Add GOES satellite imagery as an imagery layer on the Cesium globe.
 * @param {Cesium.Viewer} viewer
 * @param {string} sector - 'conus', 'global', 'meso'
 * @returns {Cesium.ImageryLayer}
 */
export function addSatelliteOverlay(viewer, sector = 'conus') {
  const tileUrl = getSatelliteTileUrl(sector);
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: tileUrl,
    maximumLevel: 12,
    credit: new Cesium.Credit('GOES Satellite (NOAA)', false),
  });
  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.name = SAT_LAYER_ID;
  layer.show = true;
  layer.alpha = 0.6;

  dataManager.register(SAT_LAYER_ID, {
    fetch: () => ({ tileUrl, sector }),
    cacheTTL: 300000, // 5 min
    source: 'NOAA GOES',
    license: 'public domain (NOAA)',
    enabled: true,
  });

  return layer;
}

/**
 * Simple archive rewind controller.
 * Tracks a history of viewport states for the 5-10h premium rewind feature.
 */
export class ArchiveRewindController {
  constructor(maxStates = 60) { // 60 states at 5-min intervals = 5h
    this.states = [];
    this.maxStates = maxStates;
    this.currentIndex = -1;
  }

  push(state) {
    this.states = this.states.slice(0, this.currentIndex + 1);
    this.states.push({ ...state, timestamp: Date.now() });
    if (this.states.length > this.maxStates) this.states.shift();
    this.currentIndex = this.states.length - 1;
  }

  rewind(steps = 1) {
    const target = Math.max(0, this.currentIndex - steps);
    this.currentIndex = target;
    return this.states[target] ?? null;
  }

  fastForward(steps = 1) {
    const target = Math.min(this.states.length - 1, this.currentIndex + steps);
    this.currentIndex = target;
    return this.states[target] ?? null;
  }

  getCurrent() {
    return this.states[this.currentIndex] ?? null;
  }

  get canRewind() {
    return this.currentIndex > 0;
  }

  get canFastForward() {
    return this.currentIndex < this.states.length - 1;
  }

  get historyDepthHours() {
    return (this.states.length * 5) / 60;
  }
}

export default { addRadarOverlay, addSatelliteOverlay, ArchiveRewindController };
