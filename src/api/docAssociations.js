import { RecordService } from './recordService';
import Records from '../components/Records';
import { t } from '../helpers/util';
import ecosFetch from '../helpers/ecosFetch';

export class DocAssociationsApi extends RecordService {
  /**
   * List of available associations
   * It is used when forming a menu (first level) and in render of documents
   *
   * @returns {*[]}
   */
  getAllowedConnections = recordRef => {
    // return [
    //   {
    //     id: 'assoc:associatedWith',
    //     name: 'Связан с',
    //     direction: 'null'
    //   },
    //   {
    //     id: 'payments:basis',
    //     name: 'Документ-основание',
    //     direction: 'BOTH'
    //   }
    // ];

    return Records.get(recordRef).load('_etype.associations[]{id,name,direction}');
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
    return ecosFetch(`/share/proxy/alfresco/api/journals/list?journalsList=site-${site}-main`, {
      headers: { 'Content-type': 'application/json;charset=UTF-8' }
    }).then(response => response.json().then(response => response.journals));
  };

  getTargetAssociations = (id, recordRef) => {
    return Records.get(recordRef).load(`${id}[]{id:.assoc,displayName:.disp,created}`);
  };

  getSourceAssociations = (id, recordRef) => {
    return Records.get(recordRef).load(`assoc_src_${id}[]{id:.assoc,displayName:.disp,created}`);
  };

  addDocuments = ({ associationId, documents, recordRef }) => {
    const record = Records.getRecordToEdit(recordRef);

    record.att(`att_add_${associationId}`, documents);

    return record.save().then(response => response);
  };

  removeDocuments = ({ associationId, documents, recordRef }) => {
    const record = Records.getRecordToEdit(recordRef);

    record.att(`att_rem_${associationId}`, documents);

    return record.save().then(response => response);
  };
}
