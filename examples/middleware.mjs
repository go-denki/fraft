// middleware.mjs — Custom middleware transform
// Run: node examples/middleware.mjs

import { FraftClient } from '@go-denki/fraft';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new FraftClient({
  config: join(__dirname, 'weather.yaml'),
});

/**
 * The Open-Meteo hourly response looks like:
 *   { hourly: { time: [...], temperature_2m: [...], ... } }
 *
 * This middleware flattens it into an array of objects, one per hour.
 */
client.use('flattenHourly', (data) => {
  const { hourly } = data;
  const { time, temperature_2m, precipitation_probability, windspeed_10m } = hourly;

  return time.map((t, i) => ({
    time: t,
    tempF: temperature_2m[i],
    precipChance: precipitation_probability[i],
    windMph: windspeed_10m[i],
  }));
});

const hourly = await client.run('nyc-hourly');
console.log('NYC hourly forecast (next 24h):');
console.log(JSON.stringify(hourly, null, 2));
