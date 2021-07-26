import _ from 'lodash';

import { ActionModes } from '../../../constants';
import { getTextByLocale } from '../../../helpers/util';
import RecordActions from '../../Records/actions';
import journalsApi from './journalsServiceApi';
import journalColumnsResolver from './journalColumnsResolver';
import journalDataLoader from './journalsDataLoader';
import computedService from './computed/computedService';
import { COMPUTED_ATT_PREFIX, COLUMN_TYPE_NEW_TO_LEGACY_MAPPING, replacePlaceholders } from './util';
import { DEFAULT_TYPE } from './constants';

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
  async isNotExistsJournal(journalId) {
    return await journalsApi.isNotExistsJournal(journalId);
  }

  async getJournalConfigByType(typeRef) {
    if (!typeRef) {
      return null;
    }

    let journal = await journalsApi.getJournalConfigByType(typeRef, '?json');
    return this._convertJournalConfig(journal);
  }

  async getJournalConfig(journalId = '', force) {
    const sourceDelimIdx = journalId.indexOf('@');
    const journalRecordId = sourceDelimIdx === -1 ? journalId : journalId.substring(sourceDelimIdx + 1);

    return this._convertJournalConfig(await journalsApi.getJournalConfig(journalRecordId, force));
  }

  async _convertJournalConfig(config) {
    if (!config) {
      return {};
    }

    const journalConfig = _.cloneDeep(config);

    const legacyConfig = this.__mapNewJournalConfigToLegacy(journalConfig);

    if (!legacyConfig.columns || !legacyConfig.columns.length) {
      return legacyConfig;
    }

    legacyConfig.configData = this._getAttsToLoadWithComputedAndUpdateConfigs(legacyConfig);
    legacyConfig.configData.configComputed = await computedService.resolve(legacyConfig.configData.configComputed);

    let columns = this.__replaceConfigPlaceholders(legacyConfig.columns, legacyConfig.configData.configComputed);

    legacyConfig.columns = await this.resolveColumns(columns);
    legacyConfig.modelVersion = 1;

    return legacyConfig;
  }

  __replaceConfigPlaceholders(columns, computed) {
    return columns.map(column => {
      ['newFormatter', 'newEditor', 'formatter', 'editor'].forEach(prop => {
        const config = _.get(column, `${prop}.config`);
        if (_.size(config) > 0) {
          _.set(
            column,
            `${prop}.config`,
            replacePlaceholders(config, computed, key => {
              if (key.indexOf('$computed.') !== 0) {
                return null;
              }
              return key.replace('$computed.', '');
            })
          );
        }
      });
      return column;
    });
  }

  // This conversion needed for backward compatibility with other code in UI.
  // TODO: update other code with new journal config and remove this method
  __mapNewJournalConfigToLegacy(config) {
    if (!config || !config.id || !config.columns || !config.columns.length) {
      return config;
    }

    const params = _.cloneDeep(config.properties || {});
    if (config.sortBy && config.sortBy.length) {
      params['defaultSortBy'] = JSON.stringify(
        config.sortBy.map(sort => {
          return {
            id: sort.attribute,
            order: sort.ascending ? 'asc' : 'desc'
          };
        })
      );
    }

    if (config.editable === false) {
      params['disableTableEditing'] = 'true';
    }
    config.params = params;

    const meta = {};
    meta.nodeRef = config.id;
    meta.actions = config.actions || [];
    meta.groupBy = config.groupBy;
    meta.metaRecord = config.metaRecord;
    meta.predicate = config.predicate || {};
    meta.title = getTextByLocale(config.label || config.name);
    meta.createVariants = (config.createVariants || []).map(cv => this.__mapCreateVariant(cv));

    config.meta = meta;

    config.columns = config.columns.map(c => this.__mapNewColumnConfigToLegacy(c));

    return config;
  }

  // This conversion needed for backward compatibility with other code in UI.
  // TODO: update other code with new journal config and remove this method
  __mapNewColumnConfigToLegacy(column) {
    const result = {};

    result.multiple = column.multiple;
    result.newFormatter = column.formatter;
    result.newAttSchema = column.attSchema;
    result.newEditor = column.editor;
    result.computed = column.computed;
    result.hidden = column.hidden === true;
    result.text = getTextByLocale(column.label || column.name);
    result.attribute = column.id || column.name;
    result.default = column.visible !== false;
    result.groupable = column.groupable === true;
    result.params = column.properties || {};
    result.schema = column.attribute;
    result.searchable = column.searchable !== false;
    result.searchableByText = column.searchableByText !== false;
    result.sortable = column.sortable === true;
    result.type = COLUMN_TYPE_NEW_TO_LEGACY_MAPPING[column.type] || DEFAULT_TYPE;
    result.visible = column.hidden !== true;
    result.editable = column.editable !== false;

    return result;
  }

  __mapCreateVariant(cv) {
    return {
      ...cv,
      title: getTextByLocale(cv.name),
      canCreate: true
    };
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
    let journalActions = journalConfig.actions;
    const actionsContext = {
      mode: ActionModes.JOURNAL,
      scope: journalConfig.id
    };

    return RecordActions.getActionsForRecords(recordRefs, journalActions, actionsContext);
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
    if (value === null || value === undefined) {
      return null;
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
    return value;
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.Journals = window.Citeck.Journals || new JournalsService();

export default window.Citeck.Journals;
