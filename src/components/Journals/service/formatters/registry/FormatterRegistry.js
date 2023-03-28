import values from 'lodash/values';

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

  getAllFormatters() {
    return Array.from(new Set(values(this.#registry)));
  }
}

export default FormattersRegistry;
