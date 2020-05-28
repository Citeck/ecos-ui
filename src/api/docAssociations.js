import { RecordService } from './recordService';
import Records from '../components/Records';
import ecosFetch from '../helpers/ecosFetch';

export class DocAssociationsApi extends RecordService {
  #baseAssociationAttributes = 'id:.assoc,modifierId:cm:modifier';

  /**
   * List of available associations
   * It is used when forming a menu (first level) and in render of documents
   *
   * @returns {*[]}
   */
  getAllowedAssociations = recordRef => {
    return Records.get(recordRef)
      .load('_etype?id')
      .then(type => {
        if (!type) {
          return [];
        }
        return (
          Records.get(type)
            .load('assocsFull[]?json')
            // .load('assocsFull[]{id,attribute,name,direction,target}')
            .then(associations => {
              return Promise.all(associations.map(association => this.getColumnConfiguration(association)));
            })
            .catch(e => {
              console.error(e);
              return [];
            })
        );
      });
  };

  getColumnConfiguration(association) {
    if (association.target === 'emodel/type@base') {
      // return {...association, columnsConfig: null };
      return {
        ...association,
        columnsConfig: {
          columns: [
            {
              attribute: '.disp',
              label: { ru: 'Заголовок', en: 'Name' },
              name: 'displayName',
              type: 'text'
            },
            {
              attribute: 'created',
              label: { ru: 'Дата создания', en: 'Create time' },
              name: 'created',
              type: 'datetime'
            }
          ]
        }
      };
    }

    return Records.queryOne(
      {
        sourceId: 'uiserv/journal',
        query: {
          typeRef: association.target
        }
      },
      '.json'
    ).then(columnsConfig => ({ ...association, columnsConfig }));
  }

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

  getTargetAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || 'id:.assoc,displayName:.disp,created';

    return Records.get(recordRef).load(`${id}[]{${this.#baseAssociationAttributes},${query}}`, true);
  };

  getSourceAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || 'id:.assoc,displayName:.disp,created';

    return Records.get(recordRef).load(`assoc_src_${id}[]{${this.#baseAssociationAttributes},${query}}`, true);
  };

  addAssociations = ({ associationId, associations, recordRef /*, isSource*/ }) => {
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
