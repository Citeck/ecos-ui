import fs from 'fs';
import os from 'os';
import path from 'path';

import { loadComponentAllowlist } from '../../../../../../vite-plugins/camelCatalogAllowlist.js';

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const REAL_ALLOWLIST = path.join(REPO_ROOT, 'public/camel-catalog-overrides/allowlist.json');

let tmpDir;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'allowlist-test-'));
});

afterAll(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

const writeJson = (name, body) => {
  const fp = path.join(tmpDir, name);
  fs.writeFileSync(fp, typeof body === 'string' ? body : JSON.stringify(body), 'utf8');
  return fp;
};

describe('loadComponentAllowlist', () => {
  test('returns null when filePath argument is missing', () => {
    expect(loadComponentAllowlist()).toBeNull();
  });

  test('returns null when filePath is not a string', () => {
    expect(loadComponentAllowlist(null)).toBeNull();
    expect(loadComponentAllowlist(undefined)).toBeNull();
    expect(loadComponentAllowlist(42)).toBeNull();
    expect(loadComponentAllowlist({})).toBeNull();
  });

  test('returns null when file is absent', () => {
    const missing = path.join(tmpDir, 'does-not-exist.json');
    expect(loadComponentAllowlist(missing)).toBeNull();
  });

  test('returns null when file contents are malformed JSON', () => {
    const fp = writeJson('malformed.json', '{ not valid json');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadComponentAllowlist(fp)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('failed to parse component allowlist'),
      expect.any(String)
    );
    warnSpy.mockRestore();
  });

  test('returns null when JSON is missing the components array', () => {
    const fp = writeJson('no-components.json', { _comment: 'header only' });
    expect(loadComponentAllowlist(fp)).toBeNull();
  });

  test('returns null when components is not an array', () => {
    const fp = writeJson('wrong-shape.json', { components: 'direct,seda' });
    expect(loadComponentAllowlist(fp)).toBeNull();
  });

  test('returns null when JSON root is not an object (array root)', () => {
    const fp = writeJson('root-array.json', ['direct', 'seda']);
    expect(loadComponentAllowlist(fp)).toBeNull();
  });

  test('returns null when JSON root is null', () => {
    const fp = writeJson('null-root.json', 'null');
    expect(loadComponentAllowlist(fp)).toBeNull();
  });

  test('returns a Set for valid allowlist file', () => {
    const fp = writeJson('valid.json', { components: ['direct', 'seda', 'http'] });
    const result = loadComponentAllowlist(fp);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result.has('direct')).toBe(true);
    expect(result.has('seda')).toBe(true);
    expect(result.has('http')).toBe(true);
    expect(result.has('not-listed')).toBe(false);
  });

  test('filters out non-string and empty-string entries', () => {
    const fp = writeJson('mixed-types.json', {
      components: ['direct', 42, null, undefined, '', 'log', {}, true]
    });
    const result = loadComponentAllowlist(fp);
    expect(result).toBeInstanceOf(Set);
    expect(Array.from(result).sort()).toEqual(['direct', 'log']);
  });

  test('handles empty components array', () => {
    const fp = writeJson('empty-components.json', { components: [] });
    const result = loadComponentAllowlist(fp);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  test('loads the real public/camel-catalog-overrides/allowlist.json', () => {
    const result = loadComponentAllowlist(REAL_ALLOWLIST);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBeGreaterThanOrEqual(30);
    // Sanity-check a few schemes that the plan mandates.
    expect(result.has('direct')).toBe(true);
    expect(result.has('http')).toBe(true);
    expect(result.has('sql')).toBe(true);
    expect(result.has('log')).toBe(true);
    // No Citeck schemes — those come from components.json overrides, not the allowlist.
    for (const scheme of result) {
      expect(scheme.startsWith('ecos-')).toBe(false);
      expect(scheme.startsWith('jira-')).toBe(false);
      expect(scheme.startsWith('gitlab-')).toBe(false);
    }
  });
});
