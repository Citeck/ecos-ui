/**
 * @typedef SortBy
 * @propery {String} attribute
 * @propery {Boolean} ascending
 */

/**
 * @typedef Page
 * @propery {Number} maxItems
 * @propery {Number} skipCount
 */

/**
 * @typedef Predicate
 * @propery {String} t - predicate type (and, or, contains, eq, not-eq, etc)
 * @propery {String} att - attribute
 * @propery {String|Number|Boolean|Predicate|Array<Predicate>|null} val
 */

/**
 * @typedef JournalSettings
 * @propery {Predicate} predicate
 * @propery {Object} queryData - additional data to send in search query
 * @propery {Object<String, String>} attributes - additional attributes to load
 * @propery {Array<SortBy>>} sortBy - search query sorting
 * @propery {Page} page -
 * @propery {Boolean} onlyLinked
 * @propery {String} recordRef
 * @propery {?Array<Object>} columns
 *
 * @todo fill all
 */

/**
 * @typedef RecordsError
 * @propery {String} type
 * @propery {String} msg
 * @propery {Array<String>} stackTrace
 */

/**
 * @typedef JournalData
 * @propery {List<Object>} records
 * @propery {List<RecordsError>} errors
 * @propery {Number} totalCount
 * @propery {Boolean} hasMore
 * @propery {Object<String, String>} attributes - requested attributes
 */

/**
 * @typedef JournalConfig
 * @propery {String} sourceId
 * @propery {Object} groupBy
 * @propery {Object} sortBy
 * @propery {Array<Object>} columns
 * @propery {Predicate} predicate
 * @propery {Object} queryData
 * @propery {Object} configData
 *
 * @todo fill all
 */

/**
 * @typedef RecordsQuery
 * @propery {String} sourceId
 * @propery {String} language
 * @propery {String} consistency
 * @propery {Object} query
 * @propery {Object} page
 */
