class FormattersRegistry {
  #registry = {};

  /**
   * @param { BaseFormatter } formatter
   */
  register(formatter) {
    let type = formatter.getType();
    this.#registry[type] = formatter;
    let aliases = formatter.getAliases() || [];
    for (let alias of aliases) {
      if (!this.#registry[alias]) {
        this.#registry[alias] = formatter;
      }
    }
  }

  /**
   * @return { BaseFormatter }
   */
  getFormatter(id) {
    return this.#registry[id];
  }
}

export default FormattersRegistry;
