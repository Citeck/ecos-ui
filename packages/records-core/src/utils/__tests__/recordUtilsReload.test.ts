import Records, { configure, getConfig } from '../../index';
import { replaceAttributeValues } from '../recordUtils';

it('keeps cached interpolation by default and can refresh nested templates from the server', async () => {
  const originalConfig = getConfig();
  const recordRef = 'emodel/ept-issue@record-utils-reload';
  let observers = ['emodel/person@before-sync'];
  configure({
    ...originalConfig,
    http: async (_url, options) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        records: options.body.records.map((id: string) => ({
          id,
          attributes: Object.fromEntries(options.body.attributes.map((att: string) => [att, [...observers]]))
        }))
      })
    })
  });

  try {
    const template = { nested: [{ observers: '${observers[]?id}', record: '${recordRef}' }] };
    const first = await replaceAttributeValues(template, recordRef);
    expect(first.nested[0].observers).toEqual(['emodel/person@before-sync']);

    observers = ['emodel/person@after-sync'];
    expect(await replaceAttributeValues(template, recordRef)).toEqual(first);
    expect(await replaceAttributeValues(template, recordRef, true)).toEqual({
      nested: [{ observers, record: recordRef }]
    });
    expect(await Records.get(recordRef).load('observers[]?id')).toEqual(observers);
    expect(template.nested[0].observers).toBe('${observers[]?id}');
  } finally {
    configure(originalConfig);
  }
});
