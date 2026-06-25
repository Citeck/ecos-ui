import fs from 'fs';
import path from 'path';

const COMPONENTS_JSON = path.resolve(
  __dirname,
  '../../../../../../public/camel-catalog-overrides/components.json'
);

let catalog;

beforeAll(() => {
  const raw = fs.readFileSync(COMPONENTS_JSON, 'utf8');
  catalog = JSON.parse(raw);
});

describe('catalog overrides — components.json shape', () => {
  test('file is valid JSON', () => {
    expect(catalog).toBeTruthy();
    expect(typeof catalog).toBe('object');
  });

  test.each([
    ['ecos-event', 'citeck,citeck-core,event'],
    ['ecos-records-query', 'citeck,citeck-core,records,query'],
    ['ecos-records-mutate', 'citeck,citeck-core,records,mutate'],
    ['ecos-records-delete', 'citeck,citeck-core,records,delete'],
    ['ecos-records-sync-consumer', 'citeck,citeck-core,records,sync'],
    ['ecos-attributes-mapper', 'citeck,citeck-core,attributes'],
    ['ecos-excel-stream-read', 'citeck,citeck-core,import,excel'],
    ['file-from-camel-dsl', 'citeck,citeck-core,file'],
    ['gitlab-commits-sync', 'citeck,citeck-addons,gitlab,sync'],
    ['gitlab-merge-requests-sync', 'citeck,citeck-addons,gitlab,sync'],
    ['jira-issues', 'citeck,citeck-addons,jira'],
    ['import-jira-attachment', 'citeck,citeck-addons,jira'],
    ['import-jira-dev-info', 'citeck,citeck-addons,jira'],
    ['import-jira-releases', 'citeck,citeck-addons,jira'],
    ['import-jira-sprint', 'citeck,citeck-addons,jira'],
    ['transform-jira-issue', 'citeck,citeck-addons,jira']
  ])('%s entry is well-formed with label "%s"', (scheme, expectedLabel) => {
    const entry = catalog[scheme];
    expect(entry).toBeTruthy();

    expect(entry.component).toBeTruthy();
    expect(entry.component.scheme).toBe(scheme);
    expect(entry.component.name).toBe(scheme);
    expect(entry.component.label).toBe(expectedLabel);
    expect(entry.component.provider).toBe('Citeck');
    expect(entry.component.kind).toBe('component');
    expect(typeof entry.component.javaType).toBe('string');
    expect(entry.component.javaType.length).toBeGreaterThan(0);
    expect(typeof entry.component.syntax).toBe('string');

    expect(entry.componentProperties).toEqual({});

    expect(entry.properties).toBeTruthy();
    expect(typeof entry.properties).toBe('object');
    expect(Object.keys(entry.properties).length).toBeGreaterThan(0);

    expect(entry.propertiesSchema).toBeTruthy();
    expect(entry.propertiesSchema.type).toBe('object');
    expect(Array.isArray(entry.propertiesSchema.required)).toBe(true);
    expect(entry.propertiesSchema.properties).toBeTruthy();
  });

  test('every property in entry.properties has a corresponding propertiesSchema entry', () => {
    for (const scheme of Object.keys(catalog)) {
      const entry = catalog[scheme];
      const propNames = Object.keys(entry.properties);
      const schemaPropNames = Object.keys(entry.propertiesSchema.properties);
      for (const name of propNames) {
        expect(schemaPropNames).toContain(name);
      }
    }
  });

  test('propertiesSchema.required only references declared properties', () => {
    for (const scheme of Object.keys(catalog)) {
      const entry = catalog[scheme];
      const schemaPropNames = Object.keys(entry.propertiesSchema.properties);
      for (const name of entry.propertiesSchema.required) {
        expect(schemaPropNames).toContain(name);
      }
    }
  });

  test('ecos-records-* entries are producer-only (createConsumer is unsupported)', () => {
    for (const scheme of ['ecos-records-query', 'ecos-records-mutate', 'ecos-records-delete']) {
      expect(catalog[scheme].component.producerOnly).toBe(true);
      expect(catalog[scheme].component.consumerOnly).toBe(false);
    }
  });

  test('ecos-records-query exposes outputType enum DATA_VALUE/JSON_STRING/JAVA/DEFAULT', () => {
    const entry = catalog['ecos-records-query'];
    expect(entry.properties.outputType).toBeTruthy();
    expect(entry.properties.outputType.enum).toEqual([
      'DATA_VALUE',
      'JSON_STRING',
      'JAVA',
      'DEFAULT'
    ]);
    expect(entry.propertiesSchema.properties.outputType.enum).toEqual([
      'DATA_VALUE',
      'JSON_STRING',
      'JAVA',
      'DEFAULT'
    ]);
  });

  test('ecos-records-mutate has sourceId, ecosType, ignoreIdScalarAtt', () => {
    const entry = catalog['ecos-records-mutate'];
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['ecosType', 'ignoreIdScalarAtt', 'sourceId'].sort()
    );
    expect(entry.properties.ignoreIdScalarAtt.type).toBe('boolean');
    expect(entry.propertiesSchema.properties.ignoreIdScalarAtt.type).toBe('boolean');
  });

  test('ecos-records-delete has sourceId, ignoreInvalidRefs', () => {
    const entry = catalog['ecos-records-delete'];
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['ignoreInvalidRefs', 'sourceId'].sort()
    );
    expect(entry.properties.ignoreInvalidRefs.type).toBe('boolean');
  });

  test('ecos-event label is updated to citeck,citeck-core,event', () => {
    expect(catalog['ecos-event'].component.label).toBe('citeck,citeck-core,event');
  });

  test('ecos-records-sync-consumer is consumer-only with required syncName and CREATED_MODIFIED default', () => {
    const entry = catalog['ecos-records-sync-consumer'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('ecos-records-sync-consumer:syncName');
    expect(entry.propertiesSchema.required).toEqual(['syncName']);
    expect(entry.properties.syncName.kind).toBe('path');
    expect(entry.properties.syncName.required).toBe(true);
    expect(entry.properties.iterationStrategy.enum).toEqual([
      'CREATED_MODIFIED',
      'CREATED',
      'MODIFIED'
    ]);
    expect(entry.properties.iterationStrategy.defaultValue).toBe('CREATED_MODIFIED');
    expect(entry.propertiesSchema.properties.iterationStrategy.enum).toEqual([
      'CREATED_MODIFIED',
      'CREATED',
      'MODIFIED'
    ]);
    expect(entry.propertiesSchema.properties.iterationStrategy.default).toBe('CREATED_MODIFIED');
    expect(entry.properties.batchSize.type).toBe('integer');
    expect(entry.properties.addAuditAttributes.type).toBe('boolean');
    expect(entry.properties.addAuditAttributes.defaultValue).toBe('true');
    expect(entry.propertiesSchema.properties.addAuditAttributes.default).toBe(true);
  });

  test('ecos-records-sync-consumer exposes the full set of UriParam fields', () => {
    const entry = catalog['ecos-records-sync-consumer'];
    expect(Object.keys(entry.properties).sort()).toEqual(
      [
        'syncName',
        'sourceId',
        'ecosType',
        'predicate',
        'initDate',
        'iterationStrategy',
        'batchSize',
        'attributes',
        'addAuditAttributes'
      ].sort()
    );
  });

  test('ecos-attributes-mapper is producer-only with required typeId path segment', () => {
    const entry = catalog['ecos-attributes-mapper'];
    expect(entry.component.producerOnly).toBe(true);
    expect(entry.component.consumerOnly).toBe(false);
    expect(entry.component.syntax).toBe('ecos-attributes-mapper:typeId');
    expect(entry.propertiesSchema.required).toEqual(['typeId']);
    expect(entry.properties.typeId.kind).toBe('path');
    expect(entry.properties.typeId.required).toBe(true);
    expect(entry.properties.delimiter.defaultValue).toBe(',');
    expect(entry.propertiesSchema.properties.delimiter.default).toBe(',');
    expect(Object.keys(entry.properties).sort()).toEqual(['delimiter', 'typeId']);
  });

  test('all 8 Citeck core schemes are present', () => {
    const expected = [
      'ecos-event',
      'ecos-records-query',
      'ecos-records-mutate',
      'ecos-records-delete',
      'ecos-records-sync-consumer',
      'ecos-attributes-mapper',
      'ecos-excel-stream-read',
      'file-from-camel-dsl'
    ];
    for (const scheme of expected) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toMatch(/^citeck,citeck-core,/);
    }
  });

  test('Citeck addons GitLab schemes are present and labelled as citeck-addons', () => {
    const expected = ['gitlab-commits-sync', 'gitlab-merge-requests-sync'];
    for (const scheme of expected) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toMatch(/^citeck,citeck-addons,/);
    }
  });

  test('ecos-excel-stream-read is consumer-only with required contentRef path segment and full UriParam set', () => {
    const entry = catalog['ecos-excel-stream-read'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('ecos-excel-stream-read:contentRef');
    expect(entry.propertiesSchema.required).toEqual(['contentRef']);
    expect(entry.properties.contentRef.kind).toBe('path');
    expect(entry.properties.contentRef.required).toBe(true);
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['batchSize', 'contentRef', 'customAttNames', 'headRowNumber', 'sheetName'].sort()
    );
    expect(entry.properties.batchSize.type).toBe('integer');
    expect(entry.properties.batchSize.defaultValue).toBe('100');
    expect(entry.propertiesSchema.properties.batchSize.default).toBe(100);
    expect(entry.properties.headRowNumber.type).toBe('integer');
    expect(entry.properties.customAttNames.type).toBe('object');
    expect(entry.propertiesSchema.properties.customAttNames.type).toBe('object');
    expect(entry.propertiesSchema.properties.customAttNames.additionalProperties).toEqual({
      type: 'string'
    });
  });

  test('file-from-camel-dsl is consumer-only with required endpointName path segment', () => {
    const entry = catalog['file-from-camel-dsl'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('file-from-camel-dsl:endpointName');
    expect(entry.propertiesSchema.required).toEqual(['endpointName']);
    expect(entry.properties.endpointName.kind).toBe('path');
    expect(entry.properties.endpointName.required).toBe(true);
    expect(Object.keys(entry.properties)).toEqual(['endpointName']);
  });

  test('gitlab-commits-sync is consumer-only with required syncName/gitLabEndpoint/gitLabToken and full UriParam set', () => {
    const entry = catalog['gitlab-commits-sync'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('gitlab-commits-sync:syncName');
    expect(entry.propertiesSchema.required).toEqual([
      'syncName',
      'gitLabEndpoint',
      'gitLabToken'
    ]);
    expect(entry.properties.syncName.kind).toBe('path');
    expect(entry.properties.syncName.required).toBe(true);
    expect(entry.properties.gitLabEndpoint.required).toBe(true);
    expect(entry.properties.gitLabToken.required).toBe(true);
    expect(entry.properties.gitLabToken.secret).toBe(true);
    expect(entry.propertiesSchema.properties.gitLabToken.format).toBe('password');
    expect(entry.propertiesSchema.properties.gitLabToken.writeOnly).toBe(true);
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['batchSize', 'gitLabEndpoint', 'gitLabToken', 'skipErrorRegex', 'syncName'].sort()
    );
    expect(entry.properties.batchSize.type).toBe('integer');
    expect(entry.properties.batchSize.defaultValue).toBe('100');
    expect(entry.propertiesSchema.properties.batchSize.default).toBe(100);
  });

  test('gitlab-merge-requests-sync is consumer-only with required syncName/gitLabEndpoint/gitLabToken and no batchSize', () => {
    const entry = catalog['gitlab-merge-requests-sync'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('gitlab-merge-requests-sync:syncName');
    expect(entry.propertiesSchema.required).toEqual([
      'syncName',
      'gitLabEndpoint',
      'gitLabToken'
    ]);
    expect(entry.properties.syncName.kind).toBe('path');
    expect(entry.properties.syncName.required).toBe(true);
    expect(entry.properties.gitLabEndpoint.required).toBe(true);
    expect(entry.properties.gitLabToken.required).toBe(true);
    expect(entry.properties.gitLabToken.secret).toBe(true);
    expect(entry.propertiesSchema.properties.gitLabToken.format).toBe('password');
    expect(entry.propertiesSchema.properties.gitLabToken.writeOnly).toBe(true);
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['gitLabEndpoint', 'gitLabToken', 'skipErrorRegex', 'syncName'].sort()
    );
    expect(entry.properties.batchSize).toBeUndefined();
  });

  test('Citeck addons Jira-import schemes are present and labelled as citeck-addons,jira', () => {
    const expected = [
      'jira-issues',
      'import-jira-attachment',
      'import-jira-component',
      'import-jira-dev-info',
      'import-jira-releases',
      'import-jira-sprint',
      'import-jira-tags'
    ];
    for (const scheme of expected) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toBe('citeck,citeck-addons,jira');
    }
  });

  test('jira-issues is consumer-only with required name path + projectKey/jiraClient and optional issueKey', () => {
    const entry = catalog['jira-issues'];
    expect(entry.component.consumerOnly).toBe(true);
    expect(entry.component.producerOnly).toBe(false);
    expect(entry.component.syntax).toBe('jira-issues:name');
    expect(entry.propertiesSchema.required).toEqual(['name', 'projectKey', 'jiraClient']);
    expect(entry.properties.name.kind).toBe('path');
    expect(entry.properties.name.required).toBe(true);
    expect(entry.properties.projectKey.required).toBe(true);
    expect(entry.properties.jiraClient.required).toBe(true);
    expect(entry.properties.jiraClient.javaType).toBe(
      'ru.citeck.ecos.camel.jira.api.JiraApiClient'
    );
    expect(entry.properties.issueKey.required).toBe(false);
    expect(entry.properties.issueKey.defaultValue).toBe('');
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['issueKey', 'jiraClient', 'name', 'projectKey'].sort()
    );
  });

  test.each([
    ['import-jira-attachment', 'common'],
    ['import-jira-dev-info', 'consumer'],
    ['import-jira-releases', 'consumer']
  ])(
    '%s is producer-only with single required jiraClient parameter (group:%s)',
    (scheme, group) => {
      const entry = catalog[scheme];
      expect(entry.component.consumerOnly).toBe(false);
      expect(entry.component.producerOnly).toBe(true);
      expect(entry.component.syntax).toBe(`${scheme}:`);
      expect(entry.propertiesSchema.required).toEqual(['jiraClient']);
      expect(Object.keys(entry.properties)).toEqual(['jiraClient']);
      expect(entry.properties.jiraClient.required).toBe(true);
      expect(entry.properties.jiraClient.javaType).toBe(
        'ru.citeck.ecos.camel.jira.api.JiraApiClient'
      );
      expect(entry.propertiesSchema.properties.jiraClient.$comment).toBe(
        `group:${group}|citeck`
      );
    }
  );

  test('import-jira-sprint is producer-only with required sprintFieldId parameter', () => {
    const entry = catalog['import-jira-sprint'];
    expect(entry.component.consumerOnly).toBe(false);
    expect(entry.component.producerOnly).toBe(true);
    expect(entry.component.syntax).toBe('import-jira-sprint:');
    expect(entry.propertiesSchema.required).toEqual(['sprintFieldId']);
    expect(Object.keys(entry.properties)).toEqual(['sprintFieldId']);
    expect(entry.properties.sprintFieldId.kind).toBe('parameter');
    expect(entry.properties.sprintFieldId.required).toBe(true);
    expect(entry.propertiesSchema.properties.sprintFieldId.$comment).toBe('group:common|citeck');
  });

  test.each([
    ['import-jira-component'],
    ['import-jira-tags'],
    ['transform-jira-comment'],
    ['transform-jira-worklog']
  ])(
    '%s is producer-only with empty properties / propertiesSchema (no UriPath/UriParam fields)',
    (scheme) => {
      const entry = catalog[scheme];
      expect(entry).toBeTruthy();
      expect(entry.component.scheme).toBe(scheme);
      expect(entry.component.label).toBe('citeck,citeck-addons,jira');
      expect(entry.component.consumerOnly).toBe(false);
      expect(entry.component.producerOnly).toBe(true);
      expect(entry.component.syntax).toBe(`${scheme}:`);
      expect(entry.componentProperties).toEqual({});
      expect(entry.properties).toEqual({});
      expect(entry.propertiesSchema.type).toBe('object');
      expect(entry.propertiesSchema.required).toEqual([]);
      expect(entry.propertiesSchema.properties).toEqual({});
    }
  );

  test('Citeck addons Jira-transform schemes are present and labelled as citeck-addons,jira', () => {
    const expected = [
      'transform-jira-comment',
      'transform-jira-issue',
      'transform-jira-worklog'
    ];
    for (const scheme of expected) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toBe('citeck,citeck-addons,jira');
    }
  });

  test('transform-jira-issue is producer-only with required jiraClient and 5 *Property defaults', () => {
    const entry = catalog['transform-jira-issue'];
    expect(entry.component.consumerOnly).toBe(false);
    expect(entry.component.producerOnly).toBe(true);
    expect(entry.component.syntax).toBe('transform-jira-issue:');
    expect(entry.propertiesSchema.required).toEqual(['jiraClient']);
    expect(Object.keys(entry.properties).sort()).toEqual(
      [
        'jiraClient',
        'valuesMappingProperty',
        'valuesConverterProperty',
        'attributesMappingProperty',
        'staticAttributesProperty',
        'linksMappingProperty'
      ].sort()
    );
    expect(entry.properties.jiraClient.required).toBe(true);
    expect(entry.properties.jiraClient.javaType).toBe(
      'ru.citeck.ecos.camel.jira.api.JiraApiClient'
    );

    const expectedDefaults = {
      valuesMappingProperty: 'valuesMapping',
      valuesConverterProperty: 'valuesConverter',
      attributesMappingProperty: 'attributesMapping',
      staticAttributesProperty: 'staticAttributes',
      linksMappingProperty: 'linksMapping'
    };
    for (const [name, defaultValue] of Object.entries(expectedDefaults)) {
      expect(entry.properties[name].required).toBe(false);
      expect(entry.properties[name].defaultValue).toBe(defaultValue);
      expect(entry.properties[name].kind).toBe('parameter');
      expect(entry.properties[name].type).toBe('string');
      expect(entry.propertiesSchema.properties[name].default).toBe(defaultValue);
      expect(entry.propertiesSchema.properties[name].$comment).toBe('group:common|citeck');
    }
  });

  test('every Citeck property carries a $comment containing the "citeck" discriminator (§3.3 prerequisite)', () => {
    let total = 0;
    for (const [scheme, entry] of Object.entries(catalog)) {
      const props = entry.propertiesSchema.properties || {};
      for (const [propName, propDef] of Object.entries(props)) {
        total++;
        expect(typeof propDef.$comment).toBe('string');
        expect(propDef.$comment).toMatch(/citeck/);
        expect(propDef.$comment).toMatch(/^group:(common|producer|consumer)\|citeck$/);
        expect(`${scheme}.${propName}: ${propDef.$comment}`).toMatch(/citeck/);
      }
    }
    // 2026-04-29 §3.0 verification pass: ecos-event grew from 4 to 6 props (added attribute,
    // filter, transactional, outputType; removed invented recordType, typeRef) ⇒ +2.
    expect(total).toBe(52);
  });

  test('ecos-event properties carry group:common|citeck (existing override updated)', () => {
    const props = catalog['ecos-event'].propertiesSchema.properties;
    for (const propName of Object.keys(props)) {
      expect(props[propName].$comment).toBe('group:common|citeck');
    }
  });

  // U1–U8: ecos-event verification pass against EcosEventEndpoint.kt
  // (ecos-camel-core EcosEventEndpoint: @UriPath eventType (path-segment exposed as eventName per syntax),
  //  @UriParam attribute:String?, attributes:Map<String,String>?, filter:Predicate, transactional:Boolean,
  //  outputType:OutputType{DATA_VALUE,JSON_STRING,JAVA,DEFAULT}=DEFAULT). See plan §3.0.
  test('U1: ecos-event has exact UriPath/UriParam keyset from EcosEventEndpoint.kt (no recordType/typeRef)', () => {
    const entry = catalog['ecos-event'];
    expect(Object.keys(entry.properties).sort()).toEqual(
      ['attribute', 'attributes', 'eventName', 'filter', 'outputType', 'transactional'].sort()
    );
    expect(Object.keys(entry.propertiesSchema.properties).sort()).toEqual(
      ['attribute', 'attributes', 'eventName', 'filter', 'outputType', 'transactional'].sort()
    );
  });

  test('U2: ecos-event.attributes is object with additionalProperties:string (Map<String,String>)', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.attributes.type).toBe('object');
    expect(entry.propertiesSchema.properties.attributes.type).toBe('object');
    expect(entry.propertiesSchema.properties.attributes.additionalProperties).toEqual({
      type: 'string'
    });
  });

  test('U3: ecos-event.filter is object (Predicate)', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.filter.type).toBe('object');
    expect(entry.propertiesSchema.properties.filter.type).toBe('object');
  });

  test('U4: ecos-event.outputType has enum DATA_VALUE/JSON_STRING/JAVA/DEFAULT and DEFAULT default', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.outputType.enum).toEqual([
      'DATA_VALUE',
      'JSON_STRING',
      'JAVA',
      'DEFAULT'
    ]);
    expect(entry.properties.outputType.defaultValue).toBe('DEFAULT');
    expect(entry.propertiesSchema.properties.outputType.enum).toEqual([
      'DATA_VALUE',
      'JSON_STRING',
      'JAVA',
      'DEFAULT'
    ]);
    expect(entry.propertiesSchema.properties.outputType.default).toBe('DEFAULT');
  });

  test('U5: ecos-event.transactional is boolean with default false', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.transactional.type).toBe('boolean');
    expect(entry.properties.transactional.defaultValue).toBe('false');
    expect(entry.propertiesSchema.properties.transactional.type).toBe('boolean');
    expect(entry.propertiesSchema.properties.transactional.default).toBe(false);
  });

  test('U6: ecos-event.attribute is string', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.attribute.type).toBe('string');
    expect(entry.propertiesSchema.properties.attribute.type).toBe('string');
  });

  test('U7: ecos-event has eventName as required path segment (kind=path)', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.eventName.kind).toBe('path');
    expect(entry.properties.eventName.required).toBe(true);
    expect(entry.propertiesSchema.required).toEqual(['eventName']);
    expect(entry.component.syntax).toBe('ecos-event:eventName');
  });

  // U9: ecos-records-sync-consumer.predicate is object (Predicate?), not string —
  // same class of [object Object] bug as U2/U3 if a route uses `predicate: { t: ..., val: [...] }`.
  test('U9: ecos-records-sync-consumer.predicate is object (Predicate?)', () => {
    const entry = catalog['ecos-records-sync-consumer'];
    expect(entry.properties.predicate.type).toBe('object');
    expect(entry.propertiesSchema.properties.predicate.type).toBe('object');
  });

  test('all 20 Citeck schemes are present (8 core + 12 addons)', () => {
    const core = [
      'ecos-event',
      'ecos-records-query',
      'ecos-records-mutate',
      'ecos-records-delete',
      'ecos-records-sync-consumer',
      'ecos-attributes-mapper',
      'ecos-excel-stream-read',
      'file-from-camel-dsl'
    ];
    const addons = [
      'gitlab-commits-sync',
      'gitlab-merge-requests-sync',
      'jira-issues',
      'import-jira-attachment',
      'import-jira-component',
      'import-jira-dev-info',
      'import-jira-releases',
      'import-jira-sprint',
      'import-jira-tags',
      'transform-jira-comment',
      'transform-jira-issue',
      'transform-jira-worklog'
    ];
    expect(core).toHaveLength(8);
    expect(addons).toHaveLength(12);
    for (const scheme of core) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toMatch(/^citeck,citeck-core,/);
    }
    for (const scheme of addons) {
      expect(catalog[scheme]).toBeTruthy();
      expect(catalog[scheme].component.label).toMatch(/^citeck,citeck-addons,/);
    }
  });

  test('catalog now has 20 schemes total (8 Citeck core + 12 addons)', () => {
    expect(Object.keys(catalog)).toHaveLength(20);
  });

  test('ecos-event.eventName has NO enum (suggestions provided via SuggestionRegistryProvider — Task 12 §3.2)', () => {
    const entry = catalog['ecos-event'];
    expect(entry.properties.eventName).toBeTruthy();
    expect(entry.properties.eventName).not.toHaveProperty('enum');
    expect(entry.propertiesSchema.properties.eventName).toBeTruthy();
    expect(entry.propertiesSchema.properties.eventName).not.toHaveProperty('enum');
  });

  test('ecos-event entry carries a _decisionNote documenting the no-enum/use-suggestions choice (Task 12 §3.2)', () => {
    const entry = catalog['ecos-event'];
    expect(typeof entry._decisionNote).toBe('string');
    expect(entry._decisionNote).toMatch(/eventName/);
    expect(entry._decisionNote).toMatch(/no enum/i);
    expect(entry._decisionNote).toMatch(/SuggestionRegistryProvider|suggestion/i);
  });

  test('only documented enums exist in the catalog (no accidental enum on any other field — Task 12 §3.2)', () => {
    const allowedEnumLocations = new Set([
      'ecos-event.outputType',
      'ecos-records-query.outputType',
      'ecos-records-sync-consumer.iterationStrategy'
    ]);
    const found = [];
    for (const [scheme, entry] of Object.entries(catalog)) {
      for (const [name, def] of Object.entries(entry.properties || {})) {
        if (def && Object.prototype.hasOwnProperty.call(def, 'enum')) {
          found.push(`${scheme}.${name}`);
        }
      }
      const schemaProps = (entry.propertiesSchema && entry.propertiesSchema.properties) || {};
      for (const [name, def] of Object.entries(schemaProps)) {
        if (def && Object.prototype.hasOwnProperty.call(def, 'enum')) {
          found.push(`${scheme}.${name}`);
        }
      }
    }
    for (const loc of found) {
      expect(allowedEnumLocations.has(loc)).toBe(true);
    }
    expect(found).toContain('ecos-records-query.outputType');
    expect(found).toContain('ecos-records-sync-consumer.iterationStrategy');
  });
});
