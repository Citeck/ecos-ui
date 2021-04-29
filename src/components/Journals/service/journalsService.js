import _ from 'lodash';

import { ActionModes } from '../../../constants';
import RecordActions from '../../Records/actions';
import journalsApi from './journalsServiceApi';
import journalColumnsResolver from './journalColumnsResolver';
import journalDataLoader from './journalsDataLoader';
import computedService from './computed/computedService';
import { COMPUTED_ATT_PREFIX } from './util';

const COLUMN_COMPUTED_PREFIX = 'column_';

/**
 * @typedef SortBy
 * @field {String} attribute
 * @field {Boolean} ascending
 *
 * @typedef Page
 * @field {Number} maxItems
 * @field {Number} skipCount
 *
 * @typedef Predicate
 * @field {String} t - predicate type (and, or, contains, eq, not-eq, etc)
 * @field {String} att - attribute
 * @field {String|Number|Boolean|Predicate|Array<Predicate>|null} val
 *
 * @typedef JournalSettings
 * @field {Predicate} predicate
 * @field {Object} queryData - additional data to send in search query
 * @field {Object<String, String>} attributes - additional attributes to load
 * @field {Array<SortBy>>} sortBy - search query sorting
 * @field {Page} page -
 * @field {Boolean} onlyLinked
 * @field {String} recordRef
 *
 * @typedef RecordsError
 * @field {String} type
 * @field {String} msg
 * @field {Array<String>} stackTrace
 *
 * @typedef JournalData
 * @field {List<Object>} records
 * @field {List<RecordsError>} errors
 * @field {Number} totalCount
 * @field {Boolean} hasMore
 * @field {Object<String, String>} attributes - requested attributes
 */

/**
 * Service to work with journals.
 */
class JournalsService {
  async getJournalConfig(journalId = '') {
    const sourceDelimIdx = journalId.indexOf('@');
    const journalRecordId = sourceDelimIdx === -1 ? journalId : journalId.substring(sourceDelimIdx + 1);
    const journalConfig = _.cloneDeep(await journalsApi.getJournalConfig(journalRecordId));

    if (!journalConfig.columns || !journalConfig.columns.length) {
      return journalConfig;
    }

    journalConfig.columns = await this.resolveColumns(journalConfig.columns);
    journalConfig.configData = this._getAttsToLoadWithComputedAndUpdateConfigs(journalConfig);
    journalConfig.configData.configComputed = await computedService.resolve(journalConfig.configData.configComputed);
    journalConfig.modelVersion = 1;

    if (!journalConfig.predicate) {
      journalConfig.predicate = _.get(journalConfig, 'meta.predicate', {});
    }

    return journalConfig;
  }

  async resolveColumns(columns) {
    return journalColumnsResolver.resolve(columns);
  }

  /**
   * @param journalConfig
   * @param {JournalSettings} settings
   * @return {Promise<JournalData>}
   */
  async getJournalData(journalConfig, settings) {
    return journalDataLoader.load(journalConfig, settings);
  }

  /**
   * @param {Object} journalConfig
   * @param {Array<String>} recordRefs
   * @return {Promise<RecordsActionsRes>}
   */
  async getRecordActions(journalConfig, recordRefs) {
    let groupActions = journalConfig.groupActions;
    if (!groupActions) {
      groupActions = _.get(journalConfig, 'meta.groupActions', []);
    }
    let journalActions = journalConfig.actions;
    if (!journalActions) {
      journalActions = _.get(journalConfig, 'meta.actions', []);
    }

    const actionsContext = {
      mode: ActionModes.JOURNAL,
      scope: journalConfig.id
    };
    const convertedGroupActions = groupActions.map(a => {
      const actionClone = _.cloneDeep(a);
      if (!actionClone.params) {
        actionClone.params = {};
      }
      if (!actionClone.params.actionId) {
        actionClone.params.actionId = actionClone.id;
      }
      return {
        generatedAction: true,
        name: a.title,
        pluralName: a.title,
        type: 'server-group-action',
        config: actionClone
      };
    });

    return RecordActions.getActionsForRecords(recordRefs, journalActions, actionsContext).then(actionsForRecords => {
      const forRecords = {
        ...actionsForRecords.forRecords,
        actions: [...actionsForRecords.forRecords.actions, ...convertedGroupActions.filter(a => a.config.type === 'selected')]
      };
      const forQuery = {
        ...actionsForRecords.forQuery,
        actions: [...actionsForRecords.forQuery.actions, ...convertedGroupActions.filter(a => a.config.type === 'filtered')]
      };
      return {
        ...actionsForRecords,
        forQuery,
        forRecords
      };
    });
  }

  _getAttsToLoadWithComputedAndUpdateConfigs(journalConfig) {
    const attributesToLoad = new Set();
    const configComputed = [];
    const recordComputed = [];

    const processComputedList = (list, scope) => {
      if (!list) {
        return {};
      }

      const idMapping = {};

      for (let computed of list) {
        const attributesBefore = attributesToLoad.size;
        this._fillTemplateAttsAndMapComputedScope(computed.config, attributesToLoad);

        const computedList = attributesBefore !== attributesToLoad.size ? recordComputed : configComputed;
        const newComputed = {
          ...computed,
          id: scope ? scope + '.' + computed.id : computed.id
        };
        computedList.push(newComputed);

        if (newComputed.id !== computed.id) {
          idMapping[computed.id] = newComputed.id;
        }
      }
      return idMapping;
    };

    processComputedList(journalConfig.computed, '');

    if (journalConfig.columns) {
      for (let column of journalConfig.columns) {
        let computedScopeByName = processComputedList(column.computed, COLUMN_COMPUTED_PREFIX + column.attribute);

        ['formatter', 'editor', 'newFormatter', 'newEditor'].forEach(field => {
          let newConfig = this._fillTemplateAttsAndMapComputedScope((column[field] || {}).config, attributesToLoad, computedScopeByName);
          if (newConfig) {
            column[field].config = newConfig;
          }
        });
      }
    }

    return {
      attributesToLoad: [...attributesToLoad],
      configComputed,
      recordComputed
    };
  }

  _fillTemplateAttsAndMapComputedScope(value, attributes, computedIdMapping = {}) {
    if (!value) {
      return value;
    }
    if (_.isString(value)) {
      let newValue = value;
      let placeholderStart = value.indexOf('${');
      while (placeholderStart >= 0) {
        let placeholderEnd = value.indexOf('}', placeholderStart + 2);
        if (placeholderEnd === -1) {
          break;
        }
        let attribute = value.substring(placeholderStart + 2, placeholderEnd);
        if (attribute && attribute !== 'recordRef') {
          if (attribute.indexOf(COMPUTED_ATT_PREFIX) === 0) {
            let localAtt = attribute.substring(COMPUTED_ATT_PREFIX.length);
            let scope = computedIdMapping[localAtt];
            if (scope) {
              newValue = newValue.replace(`\${${attribute}}`, '${' + COMPUTED_ATT_PREFIX + scope + '}');
            }
          } else {
            attributes.add(attribute);
          }
        }
        placeholderStart = value.indexOf('${', placeholderEnd + 1);
      }

      return newValue;
    } else if (_.isObject(value)) {
      let newValue = {};
      for (let key in value) {
        if (value.hasOwnProperty(key)) {
          let mapValue = value[key];
          newValue[key] = this._fillTemplateAttsAndMapComputedScope(mapValue, attributes, computedIdMapping);
        }
      }
      return newValue;
    } else if (_.isArray(value)) {
      let newValue = [];
      for (let item of value) {
        newValue.push(this._fillTemplateAttsAndMapComputedScope(item, attributes, computedIdMapping));
      }
      return newValue;
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.Journals = window.Citeck.Journals || new JournalsService();

export default window.Citeck.Journals;
