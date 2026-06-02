import data from './kanbanData';

export default class KanbanApi {
  getTypeStatuses = () => [];
  getBoardList = ({ journalId }) => (journalId ? data.boardList : null);
  getBoardSettings = journalId => (journalId ? data.templateList : []);
  getBoardConfig = ({ boardId }) => (boardId ? data.boardConfig : {});
  getBoardCards = ({ columns } = {}) =>
    (columns || []).map(col => ({
      columnId: col.id,
      totalCount: data.journalData.totalCount,
      records: data.journalData.records
    }));
  moveCard = () => Promise.resolve({ id: 'move-card' });
  getDistinctValues = () => [
    { id: 'priority-high', label: 'High' },
    { id: 'priority-low', label: 'Low' }
  ];
}
