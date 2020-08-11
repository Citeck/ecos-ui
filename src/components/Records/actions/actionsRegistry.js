/**
 * Registry with record actions handlers. All record actions should be registered here.
 * This registry can be accessed by global reference Citeck.ActionsRegistry
 */
class ActionsRegistry {
  /**
   * @type {object<string, ActionsHandler>}
   */
  #registry = {};

  /**
   * @param {string} id
   * @return {ActionsHandler}
   */
  getHandler(id) {
    return this.#registry[id];
  }

  /**
   * @param {ActionsHandler} handler
   */
  register(handler) {
    this.#registry[handler.getId()] = handler;

    for (let alias of handler.getAliases()) {
      if (!this.#registry[alias]) {
        this.#registry[alias] = handler;
      }
    }
  }
}

let Citeck = window.Citeck;
if (!Citeck) {
  Citeck = {};
  window.Citeck = Citeck;
}
Citeck.ActionsRegistry = Citeck.ActionsRegistry || new ActionsRegistry();
export default Citeck.ActionsRegistry;
