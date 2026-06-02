import Records from '../components/Records';
import { SourcesId } from '../constants';

import { getWorkspaceId } from '@/helpers/urls.js';

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
        columns: 'columns[]{id,name,hideItemsOlderThan,hideOldItems?bool,hasSum?bool,sumAtt}![]',
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
        groupBy: [attribute]
      },
      {
        id: attribute + '?str',
        label: attribute + '?disp'
      }
    ).then(result => (result.records || []).slice(0, 100));
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

  moveCard({ boardRef, card, column, afterCard = null, grouping = '' }) {
    const rec = Records.getRecordToEdit(`${SourcesId.BOARDS_SERVICE}@`);
    rec.att('action', 'move-card');
    // Workspace goes inside config (the sibling _workspace control-att isn't delivered to the
    // boards-service action DTO); order is workspaceScope=PRIVATE and scoped by it.
    rec.att('config', { board: boardRef, card, column, afterCard, grouping, workspace: getWorkspaceId() });
    return rec.save();
  }
}
