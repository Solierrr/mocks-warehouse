import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCatalog, root } from './catalog.mjs';

export const PUBLIC_PREFIX = 'mocks';

export function parseCloudinaryUrl(value) {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)$/.exec(value ?? '');
  if (!match) throw new Error('CLOUDINARY_URL invalida; use cloudinary://<api_key>:<api_secret>@<cloud_name>');
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

export function sign(params, apiSecret) {
  const text = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return createHash('sha1').update(text + apiSecret).digest('hex');
}

export const publicIdFor = (asset) => `${PUBLIC_PREFIX}/${asset.id}`;

export async function uploadAsset(asset, credentials, { apiBase = 'https://api.cloudinary.com', fetchImpl = fetch, now = () => Math.floor(Date.now() / 1000) } = {}) {
  const params = { overwrite: 'false', public_id: publicIdFor(asset), timestamp: String(now()), unique_filename: 'false' };
  const crop = asset.attributes?.crop;
  if (crop) params.custom_coordinates = `${crop.x},${crop.y},${crop.width},${crop.height}`;
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', credentials.apiKey);
  form.append('signature', sign(params, credentials.apiSecret));
  form.append('file', new Blob([await readFile(resolve(root, asset.path))], { type: 'image/webp' }), `${asset.id}.webp`);
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetchImpl(`${apiBase}/v1_1/${credentials.cloudName}/image/upload`, { method: 'POST', body: form });
    if (response.ok) {
      const body = await response.json();
      return { id: asset.id, existing: body.existing === true };
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await new Promise((done) => setTimeout(done, 500 * attempt));
      continue;
    }
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Upload falhou para ${asset.id}: HTTP ${response.status} ${detail}`);
  }
}

export async function uploadAll(assets, credentials, options = {}, concurrency = 4) {
  const results = { uploaded: 0, existing: 0, failed: [] };
  let next = 0;
  async function worker() {
    while (next < assets.length) {
      const asset = assets[next++];
      try {
        const outcome = await uploadAsset(asset, credentials, options);
        if (outcome.existing) results.existing += 1;
        else results.uploaded += 1;
      } catch (error) {
        results.failed.push(error.message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, assets.length) }, worker));
  return results;
}

function parseArguments(argv) {
  const options = { dryRun: false, only: null, limit: Infinity };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--dry-run') options.dryRun = true;
    else if (argv[index] === '--only') options.only = argv[++index];
    else if (argv[index] === '--limit') options.limit = Number(argv[++index]);
    else throw new Error('Usage: npm run cloudinary -- [--dry-run] [--only <category-prefix>] [--limit <n>]');
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifest = await loadCatalog();
  const assets = manifest.assets.filter((asset) => !options.only || asset.category.startsWith(options.only)).slice(0, options.limit);
  if (options.dryRun) {
    console.log(`Dry run: ${assets.length} de ${manifest.assets.length} imagens seriam enviadas com public_id ${PUBLIC_PREFIX}/<id>.`);
    return;
  }
  const credentials = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  const results = await uploadAll(assets, credentials);
  console.log(`Cloud ${credentials.cloudName}: ${results.uploaded} enviadas, ${results.existing} ja existiam, ${results.failed.length} falhas.`);
  for (const message of results.failed) console.error(message);
  if (results.failed.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
