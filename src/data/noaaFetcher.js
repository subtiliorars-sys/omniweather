/**
 * OmniWeather — NOAA Data Fetchers
 *
 * Wraps NOAA/NWS public APIs for GFS, HRRR, NAM, NEXRAD radar,
 * GOES satellite, and NASA FIRMS fires.
 *
 * All NOAA data is public domain (US gov). No API key required.
 * Rate limits are per-IP — respect them in production.
 */

const NOAA_BASE = 'https://nomads.ncep.noaa.gov/pub/data/nccf/com';
const OMP_BASE = 'https://api.open-meteo.com/v1';
const FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api';

/**
 * Fetch GFS forecast data for a point.
 * @param {number} lat
 * @param {number} lon
 * @param {number[]} fcstHours - forecast hours (0-384)
 * @returns {Promise<object>}
 */
export async function fetchGFS(lat, lon, fcstHours = [0, 3, 6, 12, 24, 48, 72, 96, 120, 144, 168, 192, 240, 384]) {
  return fetchOpenMeteo(lat, lon, 'gfs');
}

/**
 * Fetch HRRR forecast (CONUS, high resolution).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>}
 */
export async function fetchHRRR(lat, lon) {
  return fetchOpenMeteo(lat, lon, 'hrrr');
}

/**
 * Fetch NAM forecast.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>}
 */
export async function fetchNAM(lat, lon) {
  return fetchOpenMeteo(lat, lon, 'nam');
}

/**
 * Fetch current conditions + forecast from Open-Meteo (free, no key).
 * Acts as a GRIB decoder proxy for GFS/HRRR/NAM.
 */
async function fetchOpenMeteo(lat, lon, model = 'gfs') {
  const url = `${OMP_BASE}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,precipitation&forecast_days=16&models=${model}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo ${model} request failed: ${resp.status}`);
  return resp.json();
}

/**
 * Fetch NEXRAD radar mosaic (NOAA Level 2 composite).
 * Returns a tile URL template for Cesium UrlTemplateImageryProvider.
 */
export function getRadarTileUrl(bbox) {
  const [west, south, east, north] = bbox;
  return `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-qc?request=GetMap&layers=all&format=image/png&width=800&height=600&srs=EPSG:4326&bbox=${west},${south},${east},${north}`;
}

/**
 * Fetch GOES satellite imagery tile URL.
 */
export function getSatelliteTileUrl(sector = 'conus') {
  return `https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/sector/${sector}?request=GetMap&layers=visible&format=image.png`;
}

/**
 * Fetch NASA FIRMS active fire detections.
 * @param {string} token - NASA FIRMS API token
 * @param {number} lat
 * @param {number} lon
 * @param {number} radius_km
 * @returns {Promise<object[]>}
 */
export async function fetchFires(token, lat, lon, radius_km = 100) {
  const url = `${FIRMS_BASE}/point?latitude=${lat}&longitude=${lon}&radius=${radius_km}&method=MODIS&output=csv`;
  const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`NASA FIRMS request failed: ${resp.status}`);
  const text = await resp.text();
  return parseFirmsCsv(text);
}

function parseFirmsCsv(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    return Object.fromEntries(header.map((h, i) => [h.trim(), vals[i]?.trim() ?? '']));
  });
}

export default { fetchGFS, fetchHRRR, fetchNAM, getRadarTileUrl, getSatelliteTileUrl, fetchFires };
