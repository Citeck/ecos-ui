/**
 * Records client to add pre and post processing of attributes.
 * General purpose - add encryption and/or decryption of attributes values.
 * Clients allow transparent conversion of attributes and other services like forms or journals
 * can work with converted attributes like with any other.
 */
export default class RecordsClient {
  /**
   * @typedef PreProcessObj
   * @field {Object<String, String>} clientAtts - additional attributes to load
   * @field {Object<String, Any>} config - config to pass in postProcessAttsLoad.
   *                              If undefined then config from preProcessAttsLoad will be used
   *
   *
   * @param {Array<String>} attsToLoad attributes pending to load
   * @param {Object<String, Any>} config config from records source
   *
   * @return PreProcessObj if result is null postProcess won't be executed
   */
  async preProcessAtts(attsToLoad, config) {
    throw new Error('Not implemented');
  }

  /**
   * @param {Array<Any>} loadedAtts loaded attributes values
   * @param {Object<String, String>} clientAtts loaded attributes for client
   * @param {Object<String, Any>} config config from PreProcessObj.config
   */
  async postProcessAtts(loadedAtts, clientAtts, config) {
    throw new Error('Not implemented');
  }

  async prepareMutation(attributes, prepareMutData) {
    throw new Error('Not implemented');
  }

  /**
   * Check that mutated record is persisted and mutation doesn't required for it.
   * If this method return true then standard algorithm will be used to define persisted state of record
   * @param {Object<String, Any>} config configuration returned from postProcessAtts
   */
  isPersisted(config) {
    return true;
  }

  /**
   * Return client type
   */
  getType() {
    throw new Error('Not implemented');
  }
}
