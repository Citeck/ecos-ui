import _ from 'lodash';

import { ActionModes } from '../../../constants';
import { pagesStore } from '../../../helpers/indexedDB';
import { getTextByLocale, getCurrentUserName } from '../../../helpers/util';
import RecordActions from '../../Records/actions';

import computedService from './computed/computedService';
import { DEFAULT_TYPE } from './constants';
import journalColumnsResolver from './journalColumnsResolver';
import journalDataLoader from './journalsDataLoader';
import journalsApi from './journalsServiceApi';
import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING, replacePlaceholders, fillTemplateAttsAndMapComputedScope } from './util';

import { SearchInWorkspacePolicy } from '@/forms/components/custom/selectJournal/constants';
import { getWorkspaceId } from '@/helpers/urls';

const COLUMN_COMPUTED_PREFIX = 'column_';

const getSavedValue = async (config, journalSettingId) => {
  const { id } = config;

  if (!id) {
    return;
  }

  try {
    const dbValue = await pagesStore.get(id);
    const userName = getCurrentUserName();

    if (userName && dbValue?.[userName]?.columns) {
      config.columns.forEach(column => {
        let savedColumn;

        if (!!journalSettingId) {
          if (
            dbValue?.[userName]?.settings &&
            dbValue[userName].settings[journalSettingId] &&
            dbValue[userName].settings[journalSettingId][column.attribute]
          ) {
            savedColumn = dbValue[userName].settings[journalSettingId][column.attribute];
          }
        } else {
          savedColumn = dbValue[userName].columns[column.attribute];
        }

        if (savedColumn && savedColumn.width) {
          column.width = savedColumn.width;
        }
      });
    }
  } catch (e) {
    console.error(e);
  }

  return config;
};

const getColumnsWidth = columns =>
  columns.map(column => {
    if (column.width && typeof column.width === 'number') {
      column.width = `${column.width}px`;
    }

    return column;
  });

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

  async getJournalConfig(journalId = '', force, journalSettingId) {
    const sourceDelimIdx = journalId.indexOf('@');
    const journalRecordId = sourceDelimIdx === -1 ? journalId : journalId.substring(sourceDelimIdx + 1);
    let journal = await journalsApi.getJournalConfig(journalRecordId, force);
    return this._convertJournalConfig(journal, journalSettingId);
  }

  async _convertJournalConfig(config, journalSettingId) {
    if (!config) {
      return {};
    }

    const journalConfig = _.cloneDeep(config);
    let legacyConfig = this.__mapNewJournalConfigToLegacy(journalConfig);

    if (!legacyConfig.columns || !legacyConfig.columns.length) {
      return legacyConfig;
    }

    legacyConfig.columns = getColumnsWidth(legacyConfig.columns);

    // FIXME: tests are failed because getSavedValue returns undefined, but it returns our modified object
    legacyConfig = (await getSavedValue(legacyConfig, journalSettingId)) || legacyConfig;

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

    if (config.defaultSortBy && !config.sortBy) {
      config.sortBy = config.defaultSortBy;
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
    result.newEditor = this.__mapEditor(column.editor);
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
    result.newType = column.type;
    result.visible = column.hidden !== true;
    result.editable = column.editable !== false;
    result.searchConfig = column.searchConfig || {};
    result.headerFilterEditor = column.headerFilterEditor || {};
    result.hasTotalSumField = column.hasTotalSumField === true;
    result.width = column.width;

    return result;
  }

  __mapEditor(editor) {
    const newEditor = _.cloneDeep(editor);
    const options = _.get(newEditor, 'config.options', []);

    if (_.isEmpty(options)) {
      return newEditor;
    }

    if (Array.isArray(options)) {
      options.forEach(item => {
        if (item.label) {
          item.label = getTextByLocale(item.label);
        }
      });
    }

    return newEditor;
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
   * @param {JournalConfig} journalConfig
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
    const journalActions = journalConfig.actions;
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
        fillTemplateAttsAndMapComputedScope(computed.config, attributesToLoad);

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
          let newConfig = fillTemplateAttsAndMapComputedScope((column[field] || {}).config, attributesToLoad, computedScopeByName);
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

  /**
   *
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   */
  getRecordsQuery = async (journalConfig, settings) => {
    return journalDataLoader.getRecordsQuery(journalConfig, settings);
  };

  /**
   * Get picked predicates
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns
   */
  getPredicates = async (journalConfig, settings) => {
    return journalDataLoader.getPredicates(journalConfig, settings);
  };

  /**
   * Returns workspace IDs based on the specified search policy.
   * @param {SearchInWorkspacePolicy} policy - The policy determining which workspaces to include.
   * @param {Array<string>} [additional=[]] - Additional workspace IDs to include, if applicable.
   * @returns {Array<string>|Set<string>} An array or set of workspace IDs based on the policy.
   */
  getWorkspaceByPolicy = (policy, additional = []) => {
    if (policy === SearchInWorkspacePolicy.ALL) {
      return [];
    }

    if (policy === SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL) {
      return [...new Set([getWorkspaceId(), ...additional])];
    }

    if (policy === SearchInWorkspacePolicy.ONLY_ADDITIONAL) {
      return additional;
    }

    return [getWorkspaceId()];
  };
}

window.Citeck = window.Citeck || {};
window.Citeck.Journals = window.Citeck.Journals || new JournalsService();

export default window.Citeck.Journals;
