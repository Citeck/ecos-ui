import Records from '../components/Records';
import { SourcesId } from '../constants';

export class KanbanApi {
  getBoardList({ journalId }) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('boardRefs[]{id:?id,name}');
  }

  getBoardConfig({ boardId }) {
    return Records.get(boardId).load('?json');
  }

  moveRecord({ recordRef, columnId }) {
    const rec = Records.get(recordRef);
    rec.att('_status', columnId);
    return rec.save();
  }
}
