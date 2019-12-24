import { RecordService } from './recordService';
import Records from '../components/Records';
import ecosFetch from '../helpers/ecosFetch';

export class DocAssociationsApi extends RecordService {
  /**
   * List of available associations
   * It is used when forming a menu (first level) and in render of documents
   *
   * @returns {*[]}
   */
  getAllowedAssociations = recordRef => {
    return Records.get(recordRef).load('_etype.associations[]{id,name,direction}');
  };

  /**
   * List of selected documents (used to draw associations)
   *
   * @param recordRef
   * @param connections
   * @returns {*}
   */
  getAssociations = (recordRef, connections) => {
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
   * Partition List - Second Level Menu
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
   * Journal List - Third Level Menu
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

  addAssociations = ({ associationId, associations, recordRef }) => {
    const record = Records.getRecordToEdit(recordRef);

    record.att(`att_add_${associationId}`, associations);

    return record.save().then(response => response);
  };

  removeAssociations = ({ associationId, association, recordRef }) => {
    const record = Records.getRecordToEdit(recordRef);

    record.att(`att_rem_${associationId}`, [association]);

    return record.save().then(response => response);
  };
}
