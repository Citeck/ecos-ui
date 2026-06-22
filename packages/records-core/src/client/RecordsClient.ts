/**
 * Records client to add pre and post processing of attributes.
 * General purpose - add encryption and/or decryption of attributes values.
 * Clients allow transparent conversion of attributes and other services like forms or journals
 * can work with converted attributes like with any other.
 */
export default class RecordsClient {
  /**
   * @param attsToLoad attributes pending to load
   * @param config config from records source
   * @return PreProcessObj ({ clientAtts, config }); if null, postProcess won't run
   */
  async preProcessAtts(attsToLoad: string[], config: Record<string, any>): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * @param loadedAtts loaded attributes values
   * @param clientAtts loaded attributes for client
   * @param config config from PreProcessObj.config
   */
  async postProcessAtts(loadedAtts: any[], clientAtts: Record<string, string>, config: Record<string, any>): Promise<any> {
    throw new Error('Not implemented');
  }

  async prepareMutation(attributes: Record<string, any>, prepareMutData: any): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * Check that mutated record is persisted and mutation isn't required for it.
   * If this method returns true then the standard algorithm defines the persisted state.
   * @param config configuration returned from postProcessAtts
   */
  isPersisted(config: Record<string, any>): boolean {
    return true;
  }

  /** Return client type */
  getType(): string {
    throw new Error('Not implemented');
  }
}
