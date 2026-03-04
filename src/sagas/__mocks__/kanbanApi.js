import data from './kanbanData';

export default class KanbanApi {
  getTypeStatuses = () => [];
  getBoardList = ({ journalId }) => (journalId ? data.boardList : null);
  getBoardSettings = journalId => (journalId ? data.templateList : []);
  getBoardConfig = ({ boardId }) => (boardId ? data.boardConfig : {});
  moveRecord = ({ recordRef }) => ({ id: recordRef });
  getDistinctValues = () => [
    { id: 'priority-high', label: 'High' },
    { id: 'priority-low', label: 'Low' }
  ];
}
