/**
 * @typedef {Object} FormOptions - advanced options for form
 * @property {?String} parentId
 */

/**
 * @typedef {Object} Webform
 * @property {String} id
 * @property {String} type
 * @property {Boolean} draftEnabled
 * @property {Boolean} savingDraft
 * @property {Boolean} submitted
 * @property {Webform|null} parentForm
 * @property {FormOptions} options
 * @property {Object} form
 * @property {Object} submission
 * @property {Object} schema
 * @property {Function} setBaseUrl
 * @property {Function} setApiUrl
 * @property {Function} setAppUrl
 */
