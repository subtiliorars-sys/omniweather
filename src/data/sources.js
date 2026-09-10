/**
 * OmniWeather — Data Source Registry
 *
 * Each source declares its own fetch strategy, cache TTL, and
 * commercial-use terms. The DataLayerManager (src/data/manager.js)
 * consumes this registry to wire layers without hard-coding URLs.
 *
 * NOAA/NWS feeds are public domain. ECMWF open-data requires
 * attribution and prohibits rebundling as a commercial substitute.
 * Commercial providers (Visual Crossing, Open-Meteo, Tomorrow.io)
 * have their own TOS — verify before shipping.
 */

const SOURCES = {
  gfs: {
    name: 'GFS',
    url: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.{date}/{run}/atmos/gfs.t{run}z.pgrb2.0p25.f{fcst}',
    region: 'global',
    forecastHours: [0, 3, 6, 9, 12, 24, 48, 72, 96, 120, 144, 168, 192, 240, 384],
    cacheTTL: 3600000, // 1h
    license: 'public domain (US gov)',
  },
  nam: {
    name: 'NAM',
    url: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/nam/prod/nam.{date}/nam.t{run}z.awip12f{fcst}',
    region: 'global',
    forecastHours: [0, 3, 6, 12, 24, 36, 48, 60, 72, 84, 96, 120],
    cacheTTL: 3600000,
    license: 'public domain (US gov)',
  },
  hrrr: {
    name: 'HRRR',
    url: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod/hrrr.{date}/hrrr.t{run}z.wrfsfcf{fcst}.grib2',
    region: 'conus',
    forecastHours: [0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 30, 36, 48],
    cacheTTL: 1800000,
    license: 'public domain (US gov)',
  },
  metwave: {
    name: 'Meteomatics ECMWF',
    url: 'https://data.meteomatics.com/{token}/{date}T{run}:00:00Z/{lat},{lon}/temp_2m:C/',
    region: 'global',
    forecastHours: [0, 3, 6, 12, 24, 48, 72],
    cacheTTL: 3600000,
    license: 'ECMWF open-data — attribution required, no commercial rebundling',
  },
  openmeteo: {
    name: 'Open-Meteo',
    url: 'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m&forecast_days=16',
    region: 'global',
    forecastHours: null, // API manages forecast range
    cacheTTL: 1800000,
    license: 'CC BY 4.0 — commercial use allowed with attribution',
  },
  goes: {
    name: 'GOES Satellite',
    url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/sector/{sector}?request=GetMap&layers=visible&format=image/png',
    region: 'global',
    cacheTTL: 300000, // 5min — satellite imagery is near-real-time
    license: 'public domain (NOAA)',
  },
  radar: {
    name: 'NEXRAD Radar',
    url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-qc?request=GetMap&layers=all&format=image/png&width=800&height=600&srs=EPSG:4326&bbox={bbox}',
    region: 'us',
    cacheTTL: 300000,
    license: 'public domain (NOAA)',
  },
  noaaFirms: {
    name: 'NASA FIRMS Active Fires',
    url: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{token}/{date}/{bbox}',
    region: 'global',
    cacheTTL: 3600000,
    license: 'public domain (NASA)',
  },
  stormglass: {
    name: 'Stormglass Marine Weather',
    url: 'https://api.stormglass.io/v2/weather/point?lat={lat}&lng={lon}&params=waveHeight,windSpeed,airTemperature&start={start}&end={end}',
    region: 'global',
    cacheTTL: 3600000,
    license: 'commercial — requires API key',
  },
  tidal: {
    name: 'NOAA Tides',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date={date}&station={station}&product=predicted_water&units=metric&time_zone=gmt&application=omniweather',
    region: 'global',
    cacheTTL: 3600000,
    license: 'public domain (NOAA)',
  },
};

export default SOURCES;
