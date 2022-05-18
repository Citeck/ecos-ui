/**
 * @typedef BaseDialog
 * @property {?Boolean} isVisible
 * @property {?String} instance
 *
 * @property {?String} title
 * @property {?String} text
 * @property {?String} className
 * @property {?String} modalClass
 */

/**
 * @typedef {Object} RemoveDialog
 * @property {Function} onDelete
 * @property {Function} onCancel
 * @property {Function} onClose
 * @property {?Boolean} isWaitResponse
 */

/**
 * @typedef {Object} InfoDialog
 * @property {?Function} onClose
 */

/**
 * @typedef {Object} ConfirmDialog
 * @property {Function} onNo
 * @property {Function} onYes
 */

/**
 * @typedef {Object} CustomDialog
 * @property {?Function} onHide
 * @property body
 * @property {?Array} buttons
 * @property {?Object} handlers = {}
 * @property {?String} buttonsClassName
 */

/**
 * @typedef {Object} FormDialog
 * @property {?Function} onCancel
 * @property {?Function} onSubmit
 * @property {?String} modalClass
 * @property {?Boolean} showDefaultButtons
 * @property {?Object} reactstrapProps
 */

/**
 * @typedef {Object} LoaderDialog
 * @property {?Boolean} isVisible
 * @property {?String} text
 */
