import fs from 'fs';
import path from 'path';

// U12 (plan §3.0): yarn-patch on @kaoto/forms KeyValueField.js — display-only JSON.stringify
// for object values, so the generic Map-editor never renders "[object Object]" when a value
// happens to be an Object. Defense-in-depth complement to the structured-form path.
const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const FORMS_DIR = path.join(REPO_ROOT, 'node_modules/@kaoto/forms/dist');
const PATCH_FILE = path.join(
  REPO_ROOT,
  '.yarn/patches/@kaoto-forms-npm-1.7.2-object-value-display.patch'
);

describe('Task §3.0: yarn-patch on @kaoto/forms KeyValueField for object-value display', () => {
  test('patch file exists in .yarn/patches', () => {
    expect(fs.existsSync(PATCH_FILE)).toBe(true);
  });

  test('patch targets dist/KeyValue/KeyValueField.js with getDisplayValue + JSON.stringify', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/dist\/KeyValue\/KeyValueField\.js/);
    expect(patch).toMatch(/getDisplayValue/);
    expect(patch).toMatch(/JSON\.stringify\(value\)/);
    expect(patch).toMatch(/typeof value === 'object'/);
  });

  test('package.json wires the patch via patchedDependencies', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')
    );
    const patches = pkg.resolutions
      ? null
      : pkg.dependenciesMeta || pkg.patchedDependencies || pkg['patchedDependencies'];
    // yarn berry uses "patchedDependencies" at root; it can also live under "resolutions".
    const allPatchEntries = JSON.stringify(pkg);
    expect(allPatchEntries).toMatch(
      /@kaoto-forms-npm-1\.7\.2-object-value-display\.patch/
    );
  });

  test('installed KeyValueField.js contains getDisplayValue + JSON.stringify object branch', () => {
    const file = path.join(FORMS_DIR, 'KeyValue/KeyValueField.js');
    expect(fs.existsSync(file)).toBe(true);
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toMatch(/getDisplayValue/);
    expect(src).toMatch(/JSON\.stringify\(value\)/);
    expect(src).toMatch(/typeof value === 'object'/);
    // The patched KeyValueField uses displayValue both for suggestions and TextInput
    expect(src).toMatch(/value: displayValue/);
  });
});
