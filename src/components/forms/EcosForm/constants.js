export const FORM_MODE_CLONE = 'CLONE';
export const FORM_MODE_CREATE = 'CREATE';
export const FORM_MODE_EDIT = 'EDIT';
export const FORM_MODE_VIEW = 'VIEW';

/**
 * Whether the form creates a record that does not exist yet, so there is no stored record state
 * (workspace, permissions) to read — the form's own data is the only source.
 *
 * @param {string} [formMode]
 * @returns {boolean}
 */
export const isNewRecordFormMode = formMode => formMode === FORM_MODE_CREATE || formMode === FORM_MODE_CLONE;
