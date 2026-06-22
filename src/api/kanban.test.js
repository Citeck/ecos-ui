import Records from '@citeck/records-core';

import { KanbanApi } from './kanban';

const { SourcesId } = jest.requireActual('@citeck/constants');

jest.mock('@citeck/records-core', () => {
  const query = jest.fn(() => Promise.resolve({ records: [], totalCount: 0 }));
  const load = jest.fn(() => Promise.resolve([]));
  const get = jest.fn(() => ({ load }));
  const save = jest.fn(() => Promise.resolve({ id: 'move-card' }));
  const att = jest.fn();
  const getRecordToEdit = jest.fn(() => ({ att, save }));
  return { __esModule: true, default: { query, get, getRecordToEdit }, _mocks: { query, get, load, save, att, getRecordToEdit } };
});

describe('KanbanApi board-cards integration', () => {
  const api = new KanbanApi();
  afterEach(() => jest.clearAllMocks());

  it('getBoardCards builds a single board-cards query that hydrates cards inline', async () => {
    const { query } = jest.requireMock('@citeck/records-core')._mocks;
    query.mockResolvedValueOnce({ records: [] });

    await api.getBoardCards({
      boardRef: 'uiserv/rboard@b1',
      columns: [{ id: 'OPEN', skipCount: 20, maxItems: 10 }],
      filter: { t: 'eq', att: 'a', val: 1 },
      maxItemsPerColumn: 10,
      grouping: '',
      attributes: { name: '.disp', cardId: '.id' }
    });

    expect(Records.query).toHaveBeenCalledWith(
      {
        sourceId: SourcesId.BOARD_CARDS,
        query: {
          board: 'uiserv/rboard@b1',
          columns: [{ id: 'OPEN', skipCount: 20, maxItems: 10 }],
          filter: { t: 'eq', att: 'a', val: 1 },
          maxItemsPerColumn: 10,
          grouping: ''
        },
        // order is workspaceScope=PRIVATE on the backend -> read is scoped to the current workspace
        workspaces: ['']
      },
      // cards hydrated inline in ONE request via the association; aliases backslash-escaped (safe special chars),
      // id:?id keeps every record's ref
      { columnId: 'columnId', totalCount: 'totalCount?num', cards: 'cards[]{name:.disp,cardId:.id,id:?id}' }
    );
  });

  it('getBoardCards returns [{columnId,totalCount,records}] from the inline cards in one request', async () => {
    const { query, get } = jest.requireMock('@citeck/records-core')._mocks;
    query.mockResolvedValueOnce({
      records: [
        {
          columnId: 'OPEN',
          totalCount: 3,
          cards: [
            { id: 'src@c1', name: 'one' },
            { id: 'src@c2', name: 'two' }
          ]
        },
        { columnId: 'DONE', totalCount: 1, cards: [{ id: 'src@c3', name: 'three' }] }
      ]
    });

    const result = await api.getBoardCards({
      boardRef: 'uiserv/rboard@b1',
      columns: null,
      maxItemsPerColumn: 10,
      attributes: { name: '.disp' }
    });

    // single request: no separate hydration round-trip
    expect(get).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        columnId: 'OPEN',
        totalCount: 3,
        records: [
          { id: 'src@c1', name: 'one' },
          { id: 'src@c2', name: 'two' }
        ]
      },
      { columnId: 'DONE', totalCount: 1, records: [{ id: 'src@c3', name: 'three' }] }
    ]);
  });

  it('getBoardCards always requests id:?id so each card keeps a distinct id (no dedup collapse)', async () => {
    const { query } = jest.requireMock('@citeck/records-core')._mocks;
    query.mockResolvedValueOnce({ records: [] });

    await api.getBoardCards({ boardRef: 'uiserv/rboard@b1', attributes: { cardId: '.id' } });

    expect(query.mock.calls[0][1].cards).toContain('id:?id');
  });

  it('getBoardCards backslash-escapes aliases so special chars (e.g. ":") do not break the inner schema', async () => {
    const { query } = jest.requireMock('@citeck/records-core')._mocks;
    query.mockResolvedValueOnce({ records: [] });

    await api.getBoardCards({ boardRef: 'uiserv/rboard@b1', attributes: { 'a:b': '.disp' } });

    // backslash-escaping matches AttSchemaWriterV2 / removeEscaping; the V2 reader (tried first) round-trips it,
    // whereas quoting would NOT (V2 never calls removeQuotes), leaving literal quotes in the resolved alias.
    expect(query.mock.calls[0][1].cards).toBe('cards[]{a\\:b:.disp,id:?id}');
  });

  it('moveCard mutates boards-service with move-card action and grouping', () => {
    const { att, save, getRecordToEdit } = jest.requireMock('@citeck/records-core')._mocks;
    api.moveCard({ boardRef: 'uiserv/rboard@b1', card: 'src@c1', column: 'DONE', afterCard: 'src@c2', grouping: 'priority' });
    expect(getRecordToEdit).toHaveBeenCalledWith(`${SourcesId.BOARDS_SERVICE}@`);
    expect(att).toHaveBeenCalledWith('action', 'move-card');
    expect(att).toHaveBeenCalledWith('config', {
      board: 'uiserv/rboard@b1',
      card: 'src@c1',
      column: 'DONE',
      afterCard: 'src@c2',
      grouping: 'priority',
      cards: [],
      // order is workspaceScope=PRIVATE on the backend -> workspace travels inside config
      workspace: ''
    });
    expect(save).toHaveBeenCalled();
  });
});
