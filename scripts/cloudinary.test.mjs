import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { loadCatalog } from './catalog.mjs';
import { parseCloudinaryUrl, publicIdFor, sign, uploadAll, uploadAsset } from './cloudinary.mjs';

test('parseCloudinaryUrl reads key, secret and cloud and rejects invalid values', () => {
  assert.deepEqual(parseCloudinaryUrl('cloudinary://123:abc@demo-cloud'), { apiKey: '123', apiSecret: 'abc', cloudName: 'demo-cloud' });
  assert.throws(() => parseCloudinaryUrl('https://example.com'));
  assert.throws(() => parseCloudinaryUrl(undefined));
});

test('sign orders parameters alphabetically and appends the secret', () => {
  const expected = createHash('sha256').update('overwrite=false&public_id=mocks/x&timestamp=1&unique_filename=false' + 'secret').digest('hex');
  assert.equal(sign({ unique_filename: 'false', timestamp: '1', public_id: 'mocks/x', overwrite: 'false' }, 'secret'), expected);
});

async function withServer(handler, run) {
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({ url: request.url, body: Buffer.concat(chunks).toString('latin1') });
    handler(requests.length, response);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  try {
    await run(`http://127.0.0.1:${server.address().port}`, requests);
  } finally {
    await new Promise((done) => server.close(done));
  }
}

test('uploadAsset sends a signed, non overwriting upload with the mocks/ public id', async () => {
  const { assets } = await loadCatalog();
  const asset = assets[0];
  await withServer((count, response) => response.end(JSON.stringify({ existing: false })), async (apiBase, requests) => {
    const outcome = await uploadAsset(asset, { apiKey: 'key', apiSecret: 'secret', cloudName: 'demo-cloud' }, { apiBase, now: () => 1700000000 });
    assert.deepEqual(outcome, { id: asset.id, existing: false });
    assert.equal(requests[0].url, '/v1_1/demo-cloud/image/upload');
    assert.match(requests[0].body, new RegExp(`name="public_id"\\r\\n\\r\\n${publicIdFor(asset)}\\r\\n`));
    assert.match(requests[0].body, /name="overwrite"\r\n\r\nfalse\r\n/);
    const signature = sign({ overwrite: 'false', public_id: publicIdFor(asset), timestamp: '1700000000', unique_filename: 'false' }, 'secret');
    assert.ok(requests[0].body.includes(signature));
    assert.ok(!requests[0].body.includes('secret'));
  });
});

test('uploadAll counts existing assets, retries server errors and reports failures', async () => {
  const { assets } = await loadCatalog();
  const subset = assets.slice(0, 3);
  await withServer((count, response) => {
    if (count === 1) {
      response.statusCode = 503;
      response.end('unavailable');
    } else if (count === 4) {
      response.statusCode = 401;
      response.end('bad signature');
    } else {
      response.end(JSON.stringify({ existing: count === 3 }));
    }
  }, async (apiBase) => {
    const results = await uploadAll(subset, { apiKey: 'key', apiSecret: 'secret', cloudName: 'demo-cloud' }, { apiBase }, 1);
    assert.equal(results.uploaded + results.existing + results.failed.length, 3);
    assert.equal(results.failed.length, 1);
    assert.match(results.failed[0], /HTTP 401/);
    assert.equal(results.existing, 1);
  });
});

test('uploadAsset signs custom_coordinates when the asset has a crop', async () => {
  const { assets } = await loadCatalog();
  const asset = { ...assets[0], attributes: { crop: { x: 10, y: 20, width: 300, height: 300 } } };
  await withServer((count, response) => response.end(JSON.stringify({ existing: false })), async (apiBase, requests) => {
    await uploadAsset(asset, { apiKey: 'key', apiSecret: 'secret', cloudName: 'demo-cloud' }, { apiBase, now: () => 1700000000 });
    assert.match(requests[0].body, /name="custom_coordinates"\r\n\r\n10,20,300,300\r\n/);
    const signature = sign({ custom_coordinates: '10,20,300,300', overwrite: 'false', public_id: publicIdFor(asset), timestamp: '1700000000', unique_filename: 'false' }, 'secret');
    assert.ok(requests[0].body.includes(signature));
  });
});
