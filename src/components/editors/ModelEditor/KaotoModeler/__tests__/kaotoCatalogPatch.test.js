import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const KAOTO_DIR = path.join(REPO_ROOT, 'node_modules/@kaoto/kaoto/lib');
const PATCH_FILE = path.join(REPO_ROOT, '.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch');

describe('Task 2: yarn-patch on Kaoto Catalog for initialFilterTags', () => {
  test('patch file exists in .yarn/patches', () => {
    expect(fs.existsSync(PATCH_FILE)).toBe(true);
  });

  test('patch file contains Catalog.js + Catalog.d.ts changes for initialFilterTags', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/lib\/esm\/components\/Catalog\/Catalog\.js/);
    expect(patch).toMatch(/lib\/cjs\/components\/Catalog\/Catalog\.js/);
    expect(patch).toMatch(/lib\/esm\/components\/Catalog\/Catalog\.d\.ts/);
    expect(patch).toMatch(/lib\/cjs\/components\/Catalog\/Catalog\.d\.ts/);
    expect(patch).toMatch(/useState\(props\.initialFilterTags \?\? \[\]\)/);
    expect(patch).toMatch(/initialFilterTags\?: string\[\]/);
  });

  test('patch preserves existing flows-visibility changes', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/flows-visibility\.js/);
  });

  for (const dist of ['esm', 'cjs']) {
    test(`patched Catalog.js (${dist}) reads initialFilterTags from props`, () => {
      const file = path.join(KAOTO_DIR, dist, 'components/Catalog/Catalog.js');
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/useState\(props\.initialFilterTags \?\? \[\]\)/);
      expect(src).not.toMatch(/useState\(\[\]\);[\s\S]*All tags, sorted/);
    });

    test(`patched Catalog.d.ts (${dist}) declares initialFilterTags?: string[]`, () => {
      const file = path.join(KAOTO_DIR, dist, 'components/Catalog/Catalog.d.ts');
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/initialFilterTags\?: string\[\]/);
    });
  }
});

// U14 (plan §3.0): camel-component-schema.service.js mirror-fix — after enriching
// `schema.properties.parameters` with the per-component overrides, schema-service must also
// mirror the enriched value into `schema.definitions[$ref].properties.parameters`. Otherwise
// SchemaProvider's resolveSchemaWithRef merges the un-enriched refDefinition over the inline
// enrichment and the form falls back to the generic key/value editor (root cause of the
// "[object Object]" bug for Map<String,?> and Predicate fields).
describe('Task §3.0: kaoto-kaoto patch mirrors enriched parameters into $ref definition', () => {
  test('patch file targets camel-component-schema.service.js for both cjs and esm', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(
      /lib\/cjs\/models\/visualization\/flows\/support\/camel-component-schema\.service\.js/
    );
    expect(patch).toMatch(
      /lib\/esm\/models\/visualization\/flows\/support\/camel-component-schema\.service\.js/
    );
  });

  test('patch defines the $ref-mirror block (refDef.properties.parameters = schema.properties.parameters)', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/typeof schema\.\$ref === 'string'/);
    expect(patch).toMatch(/schema\.definitions\[refPath\]/);
    expect(patch).toMatch(
      /refDef\.properties\.parameters = schema\.properties\.parameters/
    );
  });

  for (const dist of ['esm', 'cjs']) {
    test(`installed camel-component-schema.service.js (${dist}) ships the $ref-mirror`, () => {
      const file = path.join(
        KAOTO_DIR,
        dist,
        'models/visualization/flows/support/camel-component-schema.service.js'
      );
      expect(fs.existsSync(file)).toBe(true);
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/Citeck: mirror the enriched/);
      expect(src).toMatch(
        /refDef\.properties\.parameters = schema\.properties\.parameters/
      );
    });
  }
});

// U13 (plan §3.0): CiteckJsonObjectField in custom-fields-factory.js — added so Citeck
// schemas with type:'object' + $comment containing 'citeck' + empty properties (e.g. our
// `filter: Predicate`, `predicate: Predicate?`, `attributes: Map<String,String>`) render as
// a validated JSON TextArea instead of falling through to the generic key/value editor.
describe('Task §3.0: kaoto-kaoto patch ships CiteckJsonObjectField for citeck object schemas', () => {
  test('patch file mentions custom-fields-factory.js for both cjs and esm', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(
      /lib\/cjs\/components\/Visualization\/Canvas\/Form\/fields\/custom-fields-factory\.js/
    );
    expect(patch).toMatch(
      /lib\/esm\/components\/Visualization\/Canvas\/Form\/fields\/custom-fields-factory\.js/
    );
  });

  test('patch defines CiteckJsonObjectField + isCiteckJsonObject discriminator', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/CiteckJsonObjectField/);
    expect(patch).toMatch(/isCiteckJsonObject/);
    // Discriminator: object + $comment includes 'citeck' + no inline properties
    expect(patch).toMatch(/schema\.type === 'object'/);
    expect(patch).toMatch(/\$comment/);
    expect(patch).toMatch(/citeck/);
    expect(patch).toMatch(/Object\.keys\(schema\.properties \?\? \{\}\)\.length === 0/);
  });

  test('patch excludes primitive-typed Maps from CiteckJsonObjectField (so they go to PropertiesField key/value editor)', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/hasPrimitiveAdditionalProperties/);
    expect(patch).toMatch(/!hasPrimitiveAdditionalProperties\(schema\)/);
    // Helper recognises additionalProperties of primitive type
    expect(patch).toMatch(/schema\.additionalProperties\.type/);
    expect(patch).toMatch(/\['string', 'number', 'integer', 'boolean'\]/);
  });

  test('patch routes Citeck object schemas to CiteckJsonObjectField in customFieldsFactoryfactory', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/isCiteckJsonObject\(schema\)/);
    expect(patch).toMatch(/return CiteckJsonObjectField/);
  });

  test('patch wires the YAML TextArea with parse/validate (Invalid YAML / Expected an object)', () => {
    const patch = fs.readFileSync(PATCH_FILE, 'utf8');
    expect(patch).toMatch(/parse as yamlParse, stringify as yamlStringify/);
    expect(patch).toMatch(/yamlParse\(nextValue\)/);
    expect(patch).toMatch(/yamlStringify\(value, \{ indent: 2, lineWidth: 0 \}\)/);
    expect(patch).toMatch(/Invalid YAML/);
    expect(patch).toMatch(/Expected an object/);
    // Make sure the legacy JSON variant is gone
    expect(patch).not.toMatch(/JSON\.stringify\(value, null, 2\)/);
    expect(patch).not.toMatch(/Invalid JSON/);
  });

  for (const dist of ['esm', 'cjs']) {
    test(`installed custom-fields-factory.js (${dist}) ships CiteckJsonObjectField`, () => {
      const file = path.join(
        KAOTO_DIR,
        dist,
        'components/Visualization/Canvas/Form/fields/custom-fields-factory.js'
      );
      expect(fs.existsSync(file)).toBe(true);
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/CiteckJsonObjectField/);
      expect(src).toMatch(/isCiteckJsonObject/);
      expect(src).toMatch(/schema\.\$comment\.includes\('citeck'\)/);
      // Primitive Maps must fall through to default PropertiesField (key/value editor)
      expect(src).toMatch(/hasPrimitiveAdditionalProperties/);
      expect(src).toMatch(/!hasPrimitiveAdditionalProperties\(schema\)/);
      // YAML editor (not JSON) for Predicate-like nested objects
      expect(src).toMatch(/yamlParse/);
      expect(src).toMatch(/yamlStringify/);
      expect(src).toMatch(/Invalid YAML/);
      expect(src).not.toMatch(/JSON\.stringify\(value, null, 2\)/);
    });
  }
});
