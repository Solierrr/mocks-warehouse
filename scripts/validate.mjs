import { loadCatalog } from './catalog.mjs';

try {
  const manifest = await loadCatalog();
  const bytes = manifest.assets.reduce((total, asset) => total + asset.bytes, 0);
  console.log(`Validated ${manifest.assets.length} images (${(bytes / 1024 / 1024).toFixed(2)} MiB).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
