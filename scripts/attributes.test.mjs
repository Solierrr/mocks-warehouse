import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAttributes } from './catalog.mjs';

const asset = (attributes) => ({ id: 'a', width: 800, height: 1200, attributes });

test('validateAttributes accepts the documented fields', () => {
  validateAttributes(asset({ gender: 'F', age_range: '18-34', setting: 'indoor', has_text_or_brand: false, crop: { x: 100, y: 50, width: 400, height: 400 } }));
});

test('validateAttributes rejects unknown keys, bad enums and crops outside the image', () => {
  assert.throws(() => validateAttributes(asset({ hair: 'x' })), /Unknown attribute/);
  assert.throws(() => validateAttributes(asset({ gender: 'X' })), /attributes\.gender/);
  assert.throws(() => validateAttributes(asset({ age_range: '20-30' })), /attributes\.age_range/);
  assert.throws(() => validateAttributes(asset({ crop: { x: 500, y: 0, width: 400, height: 400 } })), /attributes\.crop/);
  assert.throws(() => validateAttributes(asset({ crop: { x: 0, y: 0, width: 0, height: 400 } })), /attributes\.crop/);
  assert.throws(() => validateAttributes(asset(null)), /Invalid attributes/);
});
