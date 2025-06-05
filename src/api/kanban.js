import Records from '../components/Records';
import { SourcesId } from '../constants';

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
        query: { journalId }
      },
      {
        name: '.disp',
        settings: 'settings?json'
      }
    ).then(result => result.records);
  }

  moveRecord({ recordRef, columnId }) {
    const rec = Records.get(recordRef);
    rec.att('_status', columnId);
    return rec.save();
  }
}
