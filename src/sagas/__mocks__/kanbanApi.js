import data from './kanbanData';

export default class KanbanApi {
  getBoardList = ({ journalId }) => (journalId ? data.boardList : null);
  getBoardSettings = journalId => (journalId ? data.templateList : []);
  getBoardConfig = ({ boardId }) => (boardId ? data.boardConfig : {});
  moveRecord = ({ recordRef }) => ({ id: recordRef });
}
