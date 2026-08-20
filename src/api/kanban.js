import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';

import { getWorkspaceId } from '@/helpers/urls.js';

// Upper bound for swimlane groups. Each group costs one board-cards request per row, so the list has
// to stay bounded — but the bound is an explicit page (and a warning when the server has more),
// not a silent post-hoc cut of an unbounded answer, which used to make column badges under-count.
// Accepted trade-off: a high-cardinality grouping loads up to this many row requests (in bounded
// concurrent batches, see SWIMLANE_ROWS_CHUNK in sagas/kanban.js); loading rows lazily by viewport
// would remove the total-work cost but is out of scope for this fix.
export const MAX_SWIMLANE_GROUPS = 500;

export class KanbanApi {
  getBoardList({ journalId }) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('boardRefs[]{id:?id,name}![]', true);
  }

  getBoardConfig({ boardId = '' }) {
    const id = boardId.replace(SourcesId.BOARD, SourcesId.RESOLVED_BOARD);

    return Records.get(id).load(
      {
        actions: 'actions[]?id![]',
        cardFormRef: 'cardFormRef?id',
        columns: 'columns[]{id,name,hasSum?bool,sumAtt,additionalFilter?json}![]',
        journalRef: 'journalRef?id',
        name: 'name',
        disableTitle: 'disableTitle?bool!false',
        cardTitleTemplate: 'cardTitleTemplate?str!',
        cardFieldsLabelLayout: 'cardFieldsLabelLayout?str!TOP',
        typeRef: 'typeRef?id',
        readOnly: 'readOnly?bool!true'
      },
      true
    );
  }

  getTypeStatuses(typeRef) {
    return Records.get(typeRef).load('model.statuses{id,name}[]');
  }

  getBoardSettings(journalId) {
    return Records.query(
      {
        sourceId: SourcesId.PRESETS,
        query: { journalId, workspaces: [getWorkspaceId()] }
      },
      {
        name: '.disp',
        settings: 'settings?json'
      }
    ).then(result => result.records);
  }

  getDistinctValues({ sourceId, attribute, predicates, workspaces }) {
    return Records.query(
      {
        sourceId,
        query: {
          t: 'and',
          v: predicates.filter(Boolean)
        },
        language: 'predicate',
        workspaces,
        groupBy: [attribute],
        page: { skipCount: 0, maxItems: MAX_SWIMLANE_GROUPS }
      },
      {
        id: attribute + '?str',
        label: attribute + '?disp'
      }
    ).then(result => {
      const records = result.records || [];
      const totalCount = result.totalCount;
      const hasMore = result.hasMore || (typeof totalCount === 'number' && totalCount > records.length);

      if (hasMore) {
        // No group count in the message: with groupBy the backend disables total counting and
        // reports a synthetic totalCount, so only the fact of truncation is reliable.
        console.warn(
          `[kanban/getDistinctValues] grouping by "${attribute}": showing ${records.length} groups ` +
            `(limit ${MAX_SWIMLANE_GROUPS}), the server has more; records of the omitted groups are not counted in the column badges`
        );
      }

      return records;
    });
  }

  async getBoardCards({ boardRef, columns = null, filter = null, maxItemsPerColumn, grouping = '', attributes }) {
    // One request: board-cards returns the ordered cards per column AND hydrates each card inline via
    // the `cards` association (cards is List<EntityRef> on the backend, so `cards[]{...}` resolves them).
    // `id:?id` gives every record its ref as `id`: the attr map aliases the ref as `cardId`, but the
    // sagas dedup/key cards by `record.id` — without it all cards collapse to one.
    // Escape aliases so keys with special chars (`:`, `,`) don't break the inner-schema parser. We use
    // backslash-escaping (the canonical ecos-records convention, same as AttSchemaWriterV2): the V2
    // schema reader — which AttSchemaReader tries first — skips escaped delimiters and unescapes the
    // alias back via removeEscaping. (Quoting would NOT round-trip: V2 never calls removeQuotes.)
    const escapeAlias = a => String(a).replace(/([\\:,])/g, '\\$1');
    const inner = Object.entries(attributes || {}).map(([alias, schema]) => `${escapeAlias(alias)}:${schema}`);
    const cardsAtt = `cards[]{${[...inner, 'id:?id'].join(',')}}`;

    const colRes = await Records.query(
      {
        sourceId: SourcesId.BOARD_CARDS,
        query: { board: boardRef, columns, filter, maxItemsPerColumn, grouping },
        // Card order is workspaceScope=PRIVATE on the backend; scope the read to the current workspace.
        workspaces: [getWorkspaceId()]
      },
      { columnId: 'columnId', totalCount: 'totalCount?num', cards: cardsAtt }
    );

    return (colRes.records || []).map(c => ({
      columnId: c.columnId,
      totalCount: c.totalCount,
      records: c.cards || []
    }));
  }

  moveCard({ boardRef, card, column, afterCard = null, grouping = '', cards = [] }) {
    const rec = Records.getRecordToEdit(`${SourcesId.BOARDS_SERVICE}@`);
    rec.att('action', 'move-card');
    // Workspace goes inside config (the sibling _workspace control-att isn't delivered to the
    // boards-service action DTO); order is workspaceScope=PRIVATE and scoped by it.
    // `cards` is the target column's refs in the order we render them — the service positions the
    // card within this list instead of re-fetching the column.
    rec.att('config', { board: boardRef, card, column, afterCard, grouping, cards, workspace: getWorkspaceId() });
    return rec.save();
  }
}
