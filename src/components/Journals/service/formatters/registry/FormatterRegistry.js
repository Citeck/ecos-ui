class FormattersRegistry {
  #registry = {};

  /**
   * @param { BaseFormatter } formatter
   */
  register(formatter) {
    let type = formatter.getType();
    this.#registry[type] = formatter;
  }

  /**
   * @return { BaseFormatter }
   */
  getFormatter(id) {
    return this.#registry[id];
  }
}

export default FormattersRegistry;
