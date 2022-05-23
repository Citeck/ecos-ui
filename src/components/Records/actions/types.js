/**
 * @typedef {Boolean} RecordsActionBoolResult
 * true if action was executed and something changed (update required).
 * false if action is not executed or nothing changed (update not required).
 */

/**
 * @typedef {Object} RecordsActionObjResult
 * @property {String} type
 * @property {Object} config
 */

/** @typedef {RecordsActionBoolResult|RecordsActionObjResult} RecordsActionResult */

/**
 * @typedef {Object} RecordActionFeatures
 * @property {Boolean} execForQuery
 * @property {Boolean} execForRecord
 * @property {Boolean} execForRecords
 */

/**
 * @typedef {Object} ExecForQueryOptions
 * @property {Boolean} execAsForRecords
 */

/**
 * @typedef {Object} RecordAction
 * @property {String} id
 * @property {String} type
 * @property {String} icon
 * @property {String} name
 * @property {String} pluralName
 * @property {Object} config
 * @property {?ConfirmAction} confirm
 * @property {Number} execForRecordsBatchSize
 * @property {Number} execForRecordsParallelBatchesCount
 * @property {RecordActionFeatures} features
 * @property {ExecForQueryOptions} execForQueryConfig
 * @property {String} preActionModule
 */

/**
 * @typedef {Object} ConfirmAction
 * @property {String} title
 * @property {String} message
 * @property {String} formRef
 * @property {String} modalClass
 */

/**
 * @typedef RecordActionCtxData
 * @property {Object} context
 * @property {Number} recordsMask
 */

/** @typedef {RecordAction & RecordActionCtxData} RecActionWithCtx */

/**
 * @typedef {Object} ForRecordsRes
 * @property {Array<RecActionWithCtx>} actions
 * @property {Object<String,number>} records
 */

/**
 * @typedef {Object} RecordsActionsRes
 * @property {Object<String,Array<RecActionWithCtx>>} forRecord
 * @property {ForRecordsRes} forRecords
 * @property {Object<String>} forQuery
 */

/**
 * @typedef {Object} RecordsQuery
 * @property {String} language
 * */

/**
 * @typedef {Object} PreProcessActionResult
 * @property {Boolean} preProcessed
 * @property {Boolean} configMerged
 * @property {Boolean} hasError
 * @property {?Object} config
 * @property {?Object} preProcessedRecords
 * @property {?Object} results
 */

/**
 * @typedef {Object} ActionResultInfo
 * @property {String} type
 *    @see ResultTypes
 * @property {{message?: String, url?: String, results?: Array}} data
 */

/**
 * @typedef {Object} ActionResultOptions
 * @property {Function} callback
 * @property {String} title
 * @property {Boolean} withConfirm
 */

/**
 * @typedef {Object} IterableRecordsConfig
 * @property {?Number} amountPerIteration
 */

/**
 * @typedef {Object} IteraateConfig
 * @property {?Function} callback
 * @property {?Boolean} waitCallback
 */
