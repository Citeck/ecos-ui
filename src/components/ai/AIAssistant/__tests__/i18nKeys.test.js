import fs from 'fs';
import path from 'path';

import en from '@/i18n/en.json';
import ru from '@/i18n/ru.json';

// t() falls back to the key itself, so a key present in one locale only shows up as a raw
// identifier in the interface of the other one — exactly the defect D-B-16 this test guards.
// Every prefix the components under `src/components/ai` actually ask for — an allow-list that
// covers only some of them silently exempts the rest from both checks below, which is the whole
// hole this test exists to close. Keep it in step with:
//   grep -rhoE "\bt\(\s*'[^']+'" src/components/ai | sed -E "s/.*'([^.']+\.).*/\1/" | sort -u
const AI_KEY_PREFIXES = [
  'ai-actions.',
  'ai-agent.',
  'ai-assistant.',
  'ai-code-diff.',
  'ai-content-service.',
  'ai-html-diff.',
  'script-context.',
  'script-diff.',
  'text-context.'
];

const collectAiKeys = dictionary =>
  Object.keys(dictionary)
    .filter(key => AI_KEY_PREFIXES.some(prefix => key.startsWith(prefix)))
    .sort();

// Root of the AI feature, walked below to read the keys the code actually asks for.
const AI_SOURCE_ROOT = path.resolve(__dirname, '../..');
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
// Static single-argument keys only: `t('a.b')` and `t('a.b', {...})`. A key assembled at runtime
// (`t(\`script-context.${x}\`)`) cannot be checked from here — the fallbacks that back those live
// in the units that build them (see `getScriptContextLabel`).
const T_CALL = /\bt\(\s*'([^'\\\n]+)'/g;

const listSourceFiles = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : listSourceFiles(full);
    }
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [full] : [];
  });

const collectUsedKeys = () => {
  const used = new Map();
  for (const file of listSourceFiles(AI_SOURCE_ROOT)) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = T_CALL.exec(content)) !== null) {
      const key = match[1];
      if (!AI_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        continue;
      }
      if (!used.has(key)) {
        used.set(key, path.relative(AI_SOURCE_ROOT, file));
      }
    }
  }
  return used;
};

describe('AI assistant locale keys', () => {
  // Test 44
  it('en.json and ru.json hold the same set of keys', () => {
    const enKeys = collectAiKeys(en);
    const ruKeys = collectAiKeys(ru);

    expect(enKeys.filter(key => !ruKeys.includes(key))).toEqual([]);
    expect(ruKeys.filter(key => !enKeys.includes(key))).toEqual([]);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  // D-B-16 was three keys missing from **both** locales, and a key absent on both sides is symmetric:
  // the parity assertion above passes in exactly the broken state. Only reading the keys back out of
  // the code closes that hole — otherwise the next `t('ai-actions.input.hint')` added without its
  // translations keeps the suite green while the panel shows the bare key.
  it('translates every key the AI components ask for, in both locales', () => {
    const used = collectUsedKeys();
    expect(used.size).toBeGreaterThan(0);

    const missing = [...used.entries()]
      .filter(([key]) => !String(en[key] || '').trim() || !String(ru[key] || '').trim())
      .map(([key, file]) => `${key} (${file})`);

    expect(missing).toEqual([]);
  });

  it('has no empty value among the AI keys', () => {
    [
      ['en.json', en],
      ['ru.json', ru]
    ].forEach(([name, dictionary]) => {
      const empty = collectAiKeys(dictionary).filter(key => !String(dictionary[key]).trim());
      expect({ [name]: empty }).toEqual({ [name]: [] });
    });
  });

  // Test 45
  it.each(['ai-actions.input.close', 'ai-actions.input.submit', 'ai-actions.input.placeholder'])(
    'holds a non-empty translation of %s in both locales',
    key => {
      expect(String(en[key] || '').trim()).not.toBe('');
      expect(String(ru[key] || '').trim()).not.toBe('');
    }
  );

  it.each(['text-context.general', 'text-context.description', 'text-context.name', 'text-context.comment', 'text-context.documentation'])(
    'holds a non-empty translation of %s in both locales',
    key => {
      expect(String(en[key] || '').trim()).not.toBe('');
      expect(String(ru[key] || '').trim()).not.toBe('');
    }
  );
});
