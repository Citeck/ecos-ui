/**
 * Shared bits for the "errors are shown per tab" behaviour (COREDEV-431).
 *
 * Kept in a separate leaf module on purpose: both the tabs component and the Webform override
 * need them, and importing one from the other would create a cycle.
 */

/** Class put on the `li.nav-item` of a tab that holds invalid fields. */
export const TAB_INVALID_CLASS = 'formio-component-tabs__tab_invalid';

/** Class of the icon prepended to the label of such a tab. */
export const TAB_ERROR_ICON_CLASS = 'formio-component-tabs__tab-error-icon';

/** Class of the error list rendered inside a tab pane. */
export const TAB_ERRORS_CLASS = 'formio-component-tabs__errors';

/**
 * Builds the very same markup formio's `Webform.showErrors` builds for its top alert, so a
 * per-tab list and the leftover top alert look identical.
 *
 * @param {string} title translated "Please fix the following errors..." caption
 * @param {Array} errors formio errors ({ component, message } or plain strings)
 * @returns {string} html
 */
export function buildErrorsMessage(title, errors) {
  const items = (errors || []).map(err => (err ? `<li><strong>${err.message || err}</strong></li>` : '')).join('');

  return `
      <p>${title}</p>
      <ul>
        ${items}
      </ul>
    `;
}

/**
 * All tabs components of a form, innermost first.
 *
 * Duck-typed on `showTabErrors` rather than on the component type: importing the tabs component
 * here would close a cycle (it imports this module). The check says nothing about the mode — a
 * tabs component in builder / flatten mode exposes the method just the same, and it is
 * `showTabErrors` itself that hands every error back untouched there.
 *
 * The order matters for tabs nested in tabs: the innermost tabs component must claim an error
 * first, otherwise the outer one would swallow it and the error would be listed on a tab that
 * only indirectly contains the field.
 *
 * @param {Object} form
 * @returns {Array}
 */
export function getTabsComponents(form) {
  const result = [];

  if (!form || typeof form.everyComponent !== 'function') {
    return result;
  }

  form.everyComponent(component => {
    if (component && typeof component.showTabErrors === 'function') {
      result.push(component);
    }
  });

  // everyComponent walks depth-first, parents before children — reverse to get innermost first
  return result.reverse();
}
