import fs from 'fs';
import path from 'path';

const ALLOWLIST_JSON = path.resolve(
  __dirname,
  '../../../../../../public/camel-catalog-overrides/allowlist.json'
);

let raw;
let allowlist;

beforeAll(() => {
  raw = fs.readFileSync(ALLOWLIST_JSON, 'utf8');
  allowlist = JSON.parse(raw);
});

describe('catalog overrides — allowlist.json', () => {
  test('file is valid JSON', () => {
    expect(allowlist).toBeTruthy();
    expect(typeof allowlist).toBe('object');
    expect(Array.isArray(allowlist)).toBe(false);
  });

  test('has a non-empty _comment header field documenting derivation', () => {
    expect(typeof allowlist._comment).toBe('string');
    expect(allowlist._comment.length).toBeGreaterThan(0);
    expect(allowlist._comment).toMatch(/pom\.xml/);
  });

  test('has a components array with at least 30 entries', () => {
    expect(Array.isArray(allowlist.components)).toBe(true);
    expect(allowlist.components.length).toBeGreaterThanOrEqual(30);
  });

  test('all components entries are non-empty strings', () => {
    for (const name of allowlist.components) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  test('components entries are unique (no duplicates)', () => {
    const unique = new Set(allowlist.components);
    expect(unique.size).toBe(allowlist.components.length);
  });

  test('components entries follow camel-scheme casing (lowercase, dashes only)', () => {
    for (const name of allowlist.components) {
      expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  test('contains key Camel core schemes referenced in the plan', () => {
    const required = [
      'direct',
      'seda',
      'timer',
      'cron',
      'file',
      'log',
      'bean',
      'http',
      'https',
      'sql',
      'smtp',
      'spring-rabbitmq',
      'jolt'
    ];
    for (const scheme of required) {
      expect(allowlist.components).toContain(scheme);
    }
  });

  test('does NOT include any Citeck schemes (those come from components.json overrides)', () => {
    for (const name of allowlist.components) {
      expect(name.startsWith('ecos-')).toBe(false);
      expect(name.startsWith('jira-')).toBe(false);
      expect(name.startsWith('import-jira-')).toBe(false);
      expect(name.startsWith('transform-jira-')).toBe(false);
      expect(name.startsWith('gitlab-')).toBe(false);
      expect(name).not.toBe('file-from-camel-dsl');
    }
  });
});
