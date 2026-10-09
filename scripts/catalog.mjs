import { readFile, realpath, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function dimensions(bytes) {
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && bytes.length >= 30) return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
  if (chunk === 'VP8 ' && bytes.length >= 30 && bytes.toString('hex', 23, 26) === '9d012a') return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const packed = bytes.readUInt32LE(21);
    return [(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1];
  }
  throw new Error('Unsupported WebP header');
}

export async function loadCatalog() {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.assets) || !manifest.assets.length) throw new Error('Invalid manifest');
  const categories = new Set(['companies/logos', 'companies/banners', 'companies/units', 'infrastructure', 'banners', 'professionals/images', 'solar-panels']);
  const ids = new Set();
  const paths = new Set();
  const hashes = new Set();
  const realRoot = await realpath(root);
  for (const asset of manifest.assets) {
    if (!categories.has(asset.category) || !/^[a-z0-9-]+$/.test(asset.id) || ids.has(asset.id)) throw new Error(`Invalid or repeated ID: ${asset.id}`);
    if (typeof asset.path !== 'string' || !asset.path.startsWith(`images/${asset.category}/`) || asset.path.includes('\\') || asset.path.split('/').includes('..') || !asset.path.endsWith('.webp') || paths.has(asset.path)) throw new Error(`Invalid or repeated path: ${asset.path}`);
    if (![asset.width, asset.height, asset.bytes].every((value) => Number.isInteger(value) && value > 0) || !/^[a-f0-9]{64}$/.test(asset.sha256) || typeof asset.source?.filename !== 'string') throw new Error(`Invalid metadata: ${asset.id}`);
    const filename = await realpath(resolve(root, asset.path));
    if (!filename.startsWith(realRoot + sep)) throw new Error(`File outside repository: ${asset.path}`);
    const bytes = await readFile(filename);
    if (bytes.length !== asset.bytes || digest(bytes) !== asset.sha256 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Invalid image: ${asset.path}`);
    const [width, height] = dimensions(bytes);
    const limit = asset.category === 'companies/logos' ? 512 : asset.category.includes('banner') ? 1600 : 1200;
    if (width !== asset.width || height !== asset.height || width > limit || height > limit) throw new Error(`Invalid dimensions: ${asset.path}`);
    if (hashes.has(asset.sha256)) throw new Error(`Duplicate image content: ${asset.path}`);
    ids.add(asset.id);
    paths.add(asset.path);
    hashes.add(asset.sha256);
  }
  async function walk(folder) {
    for (const entry of await readdir(resolve(root, folder), { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (!paths.has(path)) throw new Error(`File missing from manifest: ${path}`);
    }
  }
  await walk('images');
  return manifest;
}
