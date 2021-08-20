import Records from '../components/Records';
import { SourcesId } from '../constants';
import JournalsService from '../components/Journals/service/journalsService';

export class KanbanApi {
  getBoardList({ journalId }) {
    return [{ id: 'draft', name: { ru: 'название', en: 'name' } }, { id: 'draft2', name: { ru: 'название2', en: 'name2' } }];
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('boardRefs[]{id:?id,name}');
  }

  getBoardConfig({ boardId }) {
    return {
      id: 'board-identifier', // идентификатор доски
      name: { ru: 'Активные задачи', en: 'Active tasks' }, // имя доски для отображения
      readOnly: false, // возможно ли перемещать сущности между статусами
      typeRef: 'emodel/type@some-type', // ссылка на тип
      journalRef: 'uiserv/journal@active-tasks', // ссылка на журнал
      cardFormRef: 'uiserv/form@ECOSUI1242CARD', // ссылка на форму для карточки
      actions: ['uiserv/action@view-task', 'uiserv/action@view-task-in-background', 'uiserv/action@edit-task'], // действия
      columns: [
        {
          id: 'alfresco/@workspace://SpacesStore/a8b0b9a2-8eea-4c5f-86da-0dd5e20eacd8',
          name: { ru: 'Действует', en: '' }
        },
        {
          id: 'alfresco/@workspace://SpacesStore/7becc0d4-ee65-48bc-b6c3-aa83b31f9b25',
          name: { ru: 'Черновик', en: '' }
        },
        {
          id: 'alfresco/@workspace://SpacesStore/e6397523-f4ac-4a37-adeb-64e6232b7ffa',
          name: { ru: 'Удален', en: '' }
        }
      ]
    };
    return Records.get(`${SourcesId.RESOLVED_BOARD}@${boardId}`).load('?json');
  }

  async getBoardData({ boardConfig, journalConfig, params }) {
    const r = await boardConfig.columns.map(col => {
      params.predicate = [{ t: 'eq', att: '_status', val: [col.id] }];
      return JournalsService.getJournalData(journalConfig, params);
    });
    console.log(r);
    return r;
  }
}
