import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

import ecosFetch from '../helpers/ecosFetch';
import { EmodelTypes } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import { baseColumnsConfig } from '../constants/docAssociations';
import Records from '../components/Records';
import journalsService from '../components/Journals/service/journalsService';
import { DocumentsApi } from './documents';

export class DocAssociationsApi extends DocumentsApi {
  #baseAssociationAttributes = 'id:?id,modifierId:_modifier,displayName:?disp';
  #defaultAttributes = 'displayName:?disp,created';

  /**
   * List of available associations
   * It is used when forming a menu (first level) and in render of documents
   *
   * @returns {*[]}
   */
  getAllowedAssociations = recordRef => {
    return Records.get(recordRef)
      .load('_type?id')
      .then(type => {
        if (!type) {
          return [];
        }

        return Records.get(type)
          .load('associations[]{id,attribute,direction,child?bool,name,target?id,journals[]{id:?id,label:name}}')
          .then(async (associations = []) => {
            const result = await Promise.all(
              associations.map(async association => {
                const { child = false, target } = association;

                if (child && target) {
                  association['createVariants'] = await Records.get(target)
                    .load('createVariants[]?json')
                    .catch(e => {
                      console.error('[docAssociations getAllowedAssociations createVariants api error', e);
                      return [];
                    });
                }

                return association;
              })
            );

            return result;
          })
          .catch(e => {
            console.error('[docAssociations getAllowedAssociations api error', e);
            return [];
          });
      });
  };

  async getColumnConfiguration(association) {
    const baseConfig = cloneDeep(baseColumnsConfig);
    baseConfig.columns = await journalsService.resolveColumns(baseColumnsConfig.columns);

    if (association.target === EmodelTypes.BASE) {
      return new Promise(async resolve => {
        resolve({
          ...association,
          columnsConfig: baseConfig
        });
      });
    }

    return journalsService.getJournalConfigByType(association.target).then(async columnsConfig => {
      const config = isEmpty(columnsConfig) ? baseConfig : columnsConfig;

      return {
        ...association,
        columnsConfig: config
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
    const query = this.__getAttributesAsString(attributes) || this.#defaultAttributes;

    return Records.get(recordRef)
      .load(`${id}[]{${this.#baseAssociationAttributes},${query}}`, true)
      .then(res => {
        if (!Array.isArray(res)) {
          return [];
        }
        return res.filter(item => !isEmpty(item));
      });
  };

  getSourceAssociations = (id, recordRef, attributes = {}) => {
    const query = this.__getAttributesAsString(attributes) || this.#defaultAttributes;

    return Records.get(recordRef)
      .load(`assoc_src_${id}[]{${this.#baseAssociationAttributes},${query}}`, true)
      .then(res => {
        if (!Array.isArray(res)) {
          return [];
        }

        return res.filter(item => !isEmpty(item));
      });
  };

  __getAttributesAsString(attributes = {}) {
    if (isEmpty(attributes)) {
      return '';
    }
    let attsStr = '';
    for (let alias in attributes) {
      attsStr += alias + ':' + attributes[alias] + ',';
    }
    return attsStr.substring(0, attsStr.length - 1);
  }

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
