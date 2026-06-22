export default class ActionsHandler {
  /**
   * Get default model for action.
   * Can be used to define default icon or other common parts
   * of action model to avoid null values of some important properties.
   */
  getDefaultActionModel() {
    return {};
  }

  /**
   * Check a possibility of action in some context.
   * For example, action 'redirect to page' can be disabled if we already on this page.
   *
   * @param {object} context data.
   * @returns {boolean} true if an action is allowed in specified context.
   */
  isAllowedInContext(context) {
    return true;
  }

  /**
   * Get handler ID. This value will be type for RecordAction.
   *
   * For example:
   * {
   *   "id": "delete-action-id",
   *   "type": "delete" <-- method getId() should return 'delete' to link this action with ActionsHandler.
   * }
   *
   * @see RecordAction
   *
   * @return {string}
   */
  getId() {
    return this.constructor['ACTION_ID'];
  }

  /**
   * Get aliases to register this handler by multiple ID's.
   * Required to migrate old handlers without breaking a compatibility.
   * @return {String[]}
   */
  getAliases() {
    return [];
  }

  setActionsRegistry(actionsRegistry) {
    this._actionsRegistry = actionsRegistry;
  }
}
