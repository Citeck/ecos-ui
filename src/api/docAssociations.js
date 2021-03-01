import isEmpty from 'lodash/isEmpty';

import ecosFetch from '../helpers/ecosFetch';
import Records from '../components/Records';
import { DataFormatTypes, EmodelTypes } from '../constants';
import { DocumentsApi } from './documents';
import { PROXY_URI } from '../constants/alfresco';
import journalsService from '../components/Journals/service/journalsService';
import { getOutputFormat } from '../helpers/util';

export class DocAssociationsApi extends DocumentsApi {
  #baseAssociationAttributes = 'id:assoc,modifierId:att(n:"cm:modifier"){disp},displayName:disp';
  #defaultAttributes = 'displayName:disp,att(n:"created"){disp}';

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
        return Records.get(type)
          .load('assocsFull[]?json')
          .then(associations => {
            return Promise.all(associations.map(association => this.getColumnConfiguration(association)));
          })
          .catch(e => {
            console.error(e);
            return [];
          });
      });
  };

  getColumnConfiguration(association) {
    const baseColumnsConfig = {
      columns: [
        {
          attribute: '.disp',
          label: { ru: 'Заголовок', en: 'Name' },
          name: 'displayName',
          type: 'text',
          attributes: {},
          newFormatter: {
            type: 'сardDetailsLink'
          }
        },
        {
          attribute: 'created',
          label: { ru: 'Дата создания', en: 'Create time' },
          name: 'created',
          type: 'datetime',
          attributes: {},
          newFormatter: {
            type: 'script',
            config: {
              script: 'return cell ? vars.formatDate(cell) : "";',
              vars: {
                formatDate: cell => getOutputFormat(DataFormatTypes.DATETIME, cell)
              }
            }
          }
        }
      ]
    };

    if (association.target === EmodelTypes.BASE) {
      return new Promise(async resolve => {
        let columns = await journalsService.resolveColumns(baseColumnsConfig.columns);

        resolve({
          ...association,
          columnsConfig: { ...baseColumnsConfig, columns }
        });
      });
    }

    return journalsService.getJournalConfigByType(association.target).then(async columnsConfig => {
      const config = isEmpty(columnsConfig) ? baseColumnsConfig : columnsConfig;

      return {
        ...association,
        columnsConfig: { ...config }
      };
    });
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
    return ecosFetch(`${PROXY_URI}api/journals/list?journalsList=site-${site}-main`, {
      headers: { 'Content-type': 'application/json;charset=UTF-8' }
    }).then(response => response.json().then(response => response.journals));
  };

  getTargetAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || this.#defaultAttributes;

    return Records.get(recordRef)
      .load(`.atts(n:"${id}"){${this.#baseAssociationAttributes},${query}}`, true)
      .then(res => res)
      .then(res => {
        if (!Array.isArray(res)) {
          return [];
        }

        return res.filter(item => !isEmpty(item));
      });
  };

  getSourceAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || this.#defaultAttributes;

    return Records.get(recordRef)
      .load(`.atts(n:"assoc_src_${id}"){${this.#baseAssociationAttributes},${query}}`, true)
      .then(res => {
        if (!Array.isArray(res)) {
          return [];
        }

        return res.filter(item => !isEmpty(item));
      });
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
