import { RecordService } from './recordService';
import Records from '../components/Records';
import {} from '../constants';

export class DocAssociationsApi extends RecordService {
  /**
   * Список доступных связей
   * Используется при формировании меню (первый уровень) и в отрисовке документов
   *
   * @returns {*[]}
   */
  getAllowedConnections = () => {
    // TODO use real api
    return [
      {
        name: 'assoc:associatedWith',
        title: 'Связан с документами'
      },
      {
        name: 'payments:basis',
        title: 'Документ-основание'
      },
      {
        name: 'contracts:closingDocumentAgreement',
        title: 'Учётные документы'
      }
    ];
  };

  /**
   * Список выбранных документов (используется для отрисовки связей)
   *
   * @param recordRef
   * @param connections
   * @returns {*}
   */
  getDocuments = (recordRef, connections) => {
    return Records.get(recordRef)
      .load(
        {
          ...[...connections].reduce(
            (result, key) => ({ ...result, [key]: `.atts(n:"${key}"){id: assoc, displayName: disp, created: att(n:"cm:created"){str}}` }),
            {}
          )
        },
        true
      )
      .then(response => response);
  };

  /**
   * Список разделов - второй уровень меню
   *
   * @returns {*}
   */
  getSectionList = () => {
    return Records.query(
      {
        query: 'TYPE:"st:site"',
        language: 'fts-alfresco'
      },
      ['name', 'title']
    ).then(response => response);
  };

  /**
   * Список журналов - третий уровень меню
   *
   * @param site
   * @returns {Promise<any | never>}
   */
  getJournalList = site => {
    return fetch(`/share/proxy/alfresco/api/journals/list?journalsList=site-${site}-main`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-type': 'application/json;charset=UTF-8'
      }
    }).then(response => response.json().then(response => response.journals));
  };

  sagaSaveDocuments = data => {
    const { connectionId, recordRef, documents } = data;
    const record = Records.get(recordRef);

    record.att(connectionId, documents);

    return record.save().then(response => response);
  };
}
