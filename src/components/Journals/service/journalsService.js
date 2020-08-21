import journalsApi from './journalsServiceApi';
import computedResolversRegistry from './computed';
import journalColumnsResolver from './journalColumnsResolver';
import journalDataLoader from './journalsDataLoader';
import lodash from 'lodash';

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
  async getJournalConfig(journalId) {
    let sourceDelimIdx = journalId.indexOf('@');
    let journalRecordId = sourceDelimIdx === -1 ? journalId : journalId.substring(sourceDelimIdx + 1);

    let journalConfig = lodash.cloneDeep(await journalsApi.getJournalConfig(journalRecordId));
    if (!journalConfig.columns || !journalConfig.columns.length) {
      console.warn('Journal config without columns: ' + journalRecordId, journalConfig);
      return journalConfig;
    }
    journalConfig.columns = await this.resolveColumns(journalConfig.columns);
    journalConfig.computed = await this.resolveComputedParams(journalConfig.computed);
    journalConfig.modelVersion = 1;

    if (!journalConfig.predicate) {
      journalConfig.predicate = lodash.get(journalConfig, 'meta.predicate', {});
    }

    return journalConfig;
  }

  async resolveComputedParams(computedParams) {
    if (!computedParams || !computedParams.length) {
      return {};
    }

    const computedResult = await Promise.all(
      computedParams.map(it => {
        if (!it.name) {
          console.error('Computed without name', it);
          return null;
        }
        let resolver = computedResolversRegistry.getResolver(it.type);
        return resolver
          .resolve(it.config || {})
          .catch(e => {
            console.error('Computed parameter error', e, it);
            return null;
          })
          .then(value => ({
            name: it.name,
            value
          }));
      })
    );

    const computedResMap = {};
    for (let computed of computedResult) {
      computedResMap[computed.name] = computed.value;
    }

    return computedResMap;
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
}

window.Citeck = window.Citeck || {};
window.Citeck.Journals = window.Citeck.Journals || new JournalsService();

export default window.Citeck.Journals;
