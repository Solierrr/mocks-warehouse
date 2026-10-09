import { readFile, realpath, mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { digest, loadCatalog, root } from './catalog.mjs';

try {
  const target = process.argv[2];
  if (!target || process.argv.length !== 3) throw new Error('Usage: npm run sync -- <frontend-directory>');
  const manifest = await loadCatalog();
  const frontend = await realpath(resolve(target));
  await readFile(resolve(frontend, 'package.json'));
  const publicRoot = resolve(frontend, 'public');
  await mkdir(publicRoot, { recursive: true });
  if (await realpath(publicRoot) !== publicRoot) throw new Error('Public directory must not be a symbolic link');
  const destinationRoot = resolve(publicRoot, 'images/mocks');
  const files = manifest.assets.map((asset) => ({ source: resolve(root, asset.path), destination: resolve(destinationRoot, asset.path.slice('images/'.length)) }));
  files.push({ source: resolve(root, 'manifest.json'), destination: resolve(destinationRoot, 'manifest.json') });
  for (const file of files) {
    let parent = dirname(file.destination);
    while (true) {
      try {
        const actual = await realpath(parent);
        if (actual !== publicRoot && !actual.startsWith(publicRoot + sep)) throw new Error('Destination outside public directory');
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        parent = dirname(parent);
      }
    }
    try {
      if (await realpath(file.destination) !== file.destination) throw new Error(`Symbolic link destination: ${file.destination}`);
      if (digest(await readFile(file.source)) !== digest(await readFile(file.destination))) throw new Error(`Existing file differs; review it before copying: ${file.destination}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const file of files) {
    await mkdir(dirname(file.destination), { recursive: true });
    try {
      await copyFile(file.source, file.destination, 1);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  console.log(`Synced ${manifest.assets.length} images and manifest to ${destinationRoot}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
