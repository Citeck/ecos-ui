class ComputedResolversRegistry {
  #registry = {};

  /**
   *
   * @param { ComputedResolver } resolver
   */
  register(resolver) {
    let type = resolver.getType() || '';
    this.#registry[type] = resolver;

    for (let alias of resolver.getAliases()) {
      if (!this.#registry[alias]) {
        this.#registry[alias] = resolver;
      }
    }
  }

  /**
   * @return { ComputedResolver }
   */
  getResolver(id) {
    return this.#registry[id || ''];
  }
}

const INSTANCE = new ComputedResolversRegistry();
export default INSTANCE;
