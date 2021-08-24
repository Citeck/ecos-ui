import Records from '../components/Records';
import { SourcesId } from '../constants';
import JournalsService from '../components/Journals/service/journalsService';

export class KanbanApi {
  getBoardList({ journalId }) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([{ id: 'draft', name: { ru: 'название', en: 'name' } }, { id: 'draft2', name: { ru: 'название2', en: 'name2' } }]);
      }, 1000);
    });
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('boardRefs[]{id:?id,name}');
  }

  getBoardConfig({ boardId }) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: 'board-identifier', // идентификатор доски
          name: { ru: 'Активные задачи', en: 'Active tasks' }, // имя доски для отображения
          readOnly: false, // возможно ли перемещать сущности между статусами
          typeRef: 'emodel/type@some-type', // ссылка на тип
          journalRef: 'uiserv/journal@contract-agreements', // ссылка на журнал
          cardFormRef: 'uiserv/form@agreement-form_card', // ссылка на форму для карточки
          actions: ['uiserv/action@edit', 'uiserv/action@view-dashboard', 'uiserv/action@view-dashboard-in-background'], // действия
          columns: [
            {
              id: 'alfresco/@workspace://SpacesStore/a8b0b9a2-8eea-4c5f-86da-0dd5e20eacd8',
              name: { ru: 'Действует', en: '' },
              predicate: {
                t: 'contains',
                att: 'icase:caseStatusAssoc',
                val: ['alfresco/@workspace://SpacesStore/a8b0b9a2-8eea-4c5f-86da-0dd5e20eacd8']
              }
            },
            {
              id: 'alfresco/@workspace://SpacesStore/7becc0d4-ee65-48bc-b6c3-aa83b31f9b25',
              name: { ru: 'Черновик', en: '' },
              predicate: {
                t: 'contains',
                att: 'icase:caseStatusAssoc',
                val: ['alfresco/@workspace://SpacesStore/7becc0d4-ee65-48bc-b6c3-aa83b31f9b25']
              }
            },
            {
              id: 'alfresco/@workspace://SpacesStore/e6397523-f4ac-4a37-adeb-64e6232b7ffa',
              name: { ru: 'Удален', en: '' },
              predicate: {
                t: 'contains',
                att: 'icase:caseStatusAssoc',
                val: ['alfresco/@workspace://SpacesStore/e6397523-f4ac-4a37-adeb-64e6232b7ffa']
              }
            }
          ]
        });
      }, 1000);
    });
    return Records.get(`${SourcesId.RESOLVED_BOARD}@${boardId}`).load('?json');
  }
}
