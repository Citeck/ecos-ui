import 'fake-indexeddb/auto';

import loader from '../journalsDataLoader';
import { applyWorkspaceFilter } from '../workspaceFilter';

import { buildTotalSumQuery } from '@/dto/journals';
import { getEnabledWorkspaces } from '@/helpers/util';

jest.mock('../journalsServiceApi');
jest.mock('@/helpers/util', () => ({ ...jest.requireActual('@/helpers/util'), getEnabledWorkspaces: jest.fn(() => true) }));
jest.mock('@/helpers/urls', () => ({ ...jest.requireActual('@/helpers/urls'), getWorkspaceId: () => 'current' }));

const ws = (val, t = 'contains') => ({ t, att: '_workspace', val });
const text = { t: 'contains', att: 'workDescription', val: 'control' };
const and = (...val) => ({ t: 'and', val });
const config = { sourceId: 'emodel/ecos-time-tracking-type', columns: [{ attribute: '_workspace', type: 'assoc' }] };

describe('journal workspace selection', () => {
  beforeEach(() => getEnabledWorkspaces.mockReturnValue(true));

  it.each([
    ['contains', ['emodel/workspace@A']],
    ['contains', ['emodel/workspace@A', 'emodel/workspace@B']],
    ['eq', 'emodel/workspace@A'],
    ['in', ['A', 'B']]
  ])('%s selection is carried by the scope, with the text predicate retained', async (t, val) => {
    const query = await loader.getRecordsQuery(config, { filter: [ws(val, t), text] });
    expect(query.workspaces).toEqual(Array.isArray(val) && val.length === 2 ? ['A', 'B'] : ['A']);
    expect(query.query).toEqual(text);
    expect(buildTotalSumQuery({ gridQuery: query })).toMatchObject({ workspaces: query.workspaces, query: text, groupBy: ['*'] });
  });

  it('retains predicate-with-data and query metadata', async () => {
    const query = await loader.getRecordsQuery(
      { ...config, queryData: { key: 'value' } },
      {
        predicate: and(text, and(ws(['emodel/workspace@A']))),
        page: { maxItems: 10 },
        sortBy: [{ attribute: 'duration', ascending: false }]
      }
    );
    expect(query).toMatchObject({
      language: 'predicate-with-data',
      workspaces: ['A'],
      query: { data: { key: 'value' }, predicate: text },
      page: { maxItems: 10 },
      sortBy: [{ attribute: 'duration', ascending: false }]
    });
  });

  it('keeps column-driven defaults and explicit scope when no selection exists', async () => {
    expect((await loader.getRecordsQuery(config)).workspaces).toEqual([]);
    expect((await loader.getRecordsQuery({ ...config, columns: [] })).workspaces).toEqual(['current']);
    expect((await loader.getRecordsQuery(config, { workspaces: ['A'] })).workspaces).toEqual(['A']);
  });

  it('narrows explicit scope rather than replacing it', async () => {
    const query = await loader.getRecordsQuery(config, {
      workspaces: ['A', 'B'],
      filter: [ws(['emodel/workspace@B', 'emodel/workspace@C'])]
    });
    expect(query.workspaces).toEqual(['B']);
  });

  it('does not process workspace predicates when workspaces are disabled', async () => {
    getEnabledWorkspaces.mockReturnValue(false);
    const query = await loader.getRecordsQuery(config, { predicate: ws(['emodel/workspace@A']) });
    expect(query).not.toHaveProperty('workspaces');
    expect(query.query).toEqual(ws(['emodel/workspace@A']));
  });

  it('keeps an empty scope intersection false through the complete loader pipeline', async () => {
    const query = await loader.getRecordsQuery(config, { workspaces: ['B'], filter: [ws(['A']), text] });
    expect(query.workspaces).toEqual([]);
    expect(query.query).toEqual(and(text, { t: 'not', val: { t: 'and', val: [] } }));
    expect(buildTotalSumQuery({ gridQuery: query }).query).toEqual(query.query);
  });

  it('intersects AND selections and does not mutate inputs', () => {
    const predicates = [and(ws(['A', 'B']), text, and(ws(['B', 'C'])))];
    const before = JSON.stringify(predicates);
    const result = applyWorkspaceFilter(predicates, []);
    expect(result.workspaces).toEqual(['B']);
    expect(JSON.stringify(predicates)).toEqual(before);
  });

  it.each([
    [[ws(['A']), ws(['B'])], []],
    [[ws(['A'])], ['B']],
    [[ws([])], []]
  ])('an empty intersection explicitly matches nothing', (predicates, scope) => {
    expect(applyWorkspaceFilter(predicates, scope)).toEqual({
      predicates: [{ t: 'not', val: { t: 'and', val: [] } }],
      workspaces: []
    });
  });

  it('ignores workspace leaves in complex groups without promoting them into scope', async () => {
    const query = await loader.getRecordsQuery(config, {
      predicate: and({ t: 'or', val: [ws(['A']), text] }, { t: 'not', val: ws(['B']) })
    });
    expect(query.workspaces).toEqual([]);
    expect(query.query).toEqual(text);
  });

  it('does not interpret another association as a workspace selector', () => {
    const predicate = { t: 'eq', att: 'workspaceRef', val: 'emodel/workspace@A' };
    expect(applyWorkspaceFilter([predicate], [])).toEqual({ predicates: [predicate], workspaces: [] });
  });

  it('preserves standalone operators that cannot be expressed as a positive workspace selection', () => {
    const predicate = ws(['A'], 'not-contains');
    expect(applyWorkspaceFilter([predicate], [])).toEqual({ predicates: [predicate], workspaces: [] });
  });

  it('unwraps the real header filter shape: nested one-branch ORs around an AND', async () => {
    const query = await loader.getRecordsQuery(config, {
      filter: [{ t: 'or', val: [{ t: 'or', val: [and(ws(['emodel/workspace@A']))] }] }]
    });
    expect(query.workspaces).toEqual(['A']);
    expect(query.query).toEqual({});
  });
});
