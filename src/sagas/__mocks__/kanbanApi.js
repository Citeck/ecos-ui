import data from './kanbanData';

export default class KanbanApi {
  getTypeStatuses = () => [];
  getBoardList = ({ journalId }) => (journalId ? data.boardList : null);
  getBoardSettings = journalId => (journalId ? data.templateList : []);
  getBoardConfig = ({ boardId }) => (boardId ? data.boardConfig : {});
  moveRecord = ({ recordRef }) => ({ id: recordRef });
}
