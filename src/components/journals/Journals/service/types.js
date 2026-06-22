/**
 * @typedef ItemSortBy
 * @property {String} attribute
 * @property {Boolean} ascending
 */

/**
 * @typedef {Array<ItemSortBy>} SortBy
 */

/**
 * @typedef {Array<String>} GroupBy
 */

/**
 * @typedef Page
 * @property {Number} maxItems
 * @property {Number} skipCount
 */

/**
 * @typedef Predicate
 * @property {String} t - predicate type (and, or, contains, eq, not-eq, etc)
 * @property {String} att - attribute
 * @property {String|Number|Boolean|Predicate|Array<Predicate>|null} val
 */

/**
 * @typedef JournalSettings
 * @property {Predicate} predicate
 * @property {Object} queryData - additional data to send in search query
 * @property {Object} grouping
 * @property {Array<string>} workspaces
 * @property {Object<String, String>} attributes - additional attributes to load
 * @property {SortBy} sortBy - search query sorting
 * @property {GroupBy} groupBy - search query sorting
 * @property {Page} page -
 * @property {Boolean} onlyLinked
 * @property {String} recordRef
 * @property {?Array<Object>} columns
 *
 * @todo fill all
 */

/**
 * @typedef RecordsError
 * @property {String} type
 * @property {String} msg
 * @property {Array<String>} stackTrace
 */

/**
 * @typedef JournalData
 * @property {List<Object>} records
 * @property {List<RecordsError>} errors
 * @property {Number} totalCount
 * @property {Boolean} hasMore
 * @property {Object<String, String>} attributes - requested attributes
 */

/**
 * @typedef JournalConfig
 * @property {String} label
 * @property {String} name
 * @property {String} id
 * @property {String} sourceId
 * @property {String} metaRecord
 * @property {Object} meta
 * @property {Object} groupBy
 * @property {Object} sortBy
 * @property {Array<Column>} columns
 * @property {Predicate} predicate
 * @property {Object} queryData
 * @property {Object} configData
 * @property {Array<RecordAction>} actions
 * @property {Array<CreateVariant>} createVariants
 *
 * @todo fill all
 */

/**
 * @typedef Column
 * @property {?String} attribute
 * @property {?String} name
 * @property {?String} schema
 * @property {?SearchConfigCol} searchConfig
 *
 * @todo fill all
 */

/**
 * @typedef CreateVariant
 * @property {String} name
 * @property {String} type
 *
 * @todo fill all
 */

/**
 * @typedef SearchConfigCol
 * @property {Array<String>} delimiters
 * @property {Array<String>} searchByText
 *
 * @todo fill all
 */
