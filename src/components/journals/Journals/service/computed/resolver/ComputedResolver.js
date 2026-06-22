export default class ComputedResolver {
  static RESOLVER_ID = '';
  static RESOLVER_ALIASES = [];

  async resolve(config) {
    return null;
  }

  getType() {
    return this.constructor.RESOLVER_ID || '';
  }

  getAliases() {
    return this.constructor.RESOLVER_ALIASES || [];
  }
}
