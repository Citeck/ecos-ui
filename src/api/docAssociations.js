import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import ecosFetch from '../helpers/ecosFetch';
import Records from '../components/Records';
import { RecordService } from './recordService';
import { Attributes, EmodelTypes, Permissions } from '../constants';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';
import { PROXY_URI } from '../constants/alfresco';

export class DocAssociationsApi extends RecordService {
  #baseAssociationAttributes = 'id:.assoc,modifierId:cm:modifier,displayName:.disp';

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
          type: 'text'
        },
        {
          attribute: 'created',
          label: { ru: 'Дата создания', en: 'Create time' },
          name: 'created',
          type: 'datetime'
        }
      ]
    };

    if (association.target === EmodelTypes.BASE) {
      return {
        ...association,
        columnsConfig: baseColumnsConfig
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
    ).then(async columnsConfig => {
      const config = isEmpty(columnsConfig) ? baseColumnsConfig : columnsConfig;
      const { predicate = {}, columns = [] } = config;
      const queryPredicates = predicate.val || [];
      const bodyQuery = {
        query: {
          t: 'and',
          val: queryPredicates.concat(
            (predicate.val || []).filter(item => {
              return item.val !== '' && item.val !== null;
            })
          )
        },
        language: 'predicate',
        consistency: 'EVENTUAL'
      };

      if (columnsConfig.sourceId) {
        bodyQuery['sourceId'] = columnsConfig.sourceId;
      }

      const dataSource = new dataSourceStore['GqlDataSource']({
        url: `${PROXY_URI}citeck/ecos/records`,
        dataSourceName: 'GqlDataSource',
        ajax: {
          body: {
            query: bodyQuery
          }
        },
        columns: columns || [],
        permissions: [Permissions.Write]
      });

      await dataSource.load();

      const formattedColums = dataSource.getColumns();

      return {
        ...association,
        columnsConfig: {
          ...config,
          columns: formattedColums
        }
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
    return ecosFetch(`/share/proxy/alfresco/api/journals/list?journalsList=site-${site}-main`, {
      headers: { 'Content-type': 'application/json;charset=UTF-8' }
    }).then(response => response.json().then(response => response.journals));
  };

  getTargetAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || 'displayName:.disp,created';

    return Records.get(recordRef).load(`${id}[]{${this.#baseAssociationAttributes},${query}}`, true);
  };

  getSourceAssociations = (id, recordRef, attributes = '') => {
    const query = attributes || 'displayName:.disp,created';

    return Records.get(recordRef).load(`assoc_src_${id}[]{${this.#baseAssociationAttributes},${query}}`, true);
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
