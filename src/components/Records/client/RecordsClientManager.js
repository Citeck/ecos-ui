export default class RecordsClientManager {
  constructor() {
    this._clientsByType = {};
  }

  init(records) {
    for (let type in this._clientsByType) {
      if (!this._clientsByType.hasOwnProperty(type)) {
        continue;
      }
      const client = this._clientsByType[type];
      if (client.init) {
        client.init(records);
      }
    }
  }

  /**
   * @param sourceId - Records source id
   * @param attsToLoad - Array<String> of attributes to load
   *
   * TODO: Implement optimized logic to fetch client info with fewer requests
   */
  async preProcessAtts(sourceId, attsToLoad) {
    return null;
  }

  async postProcessAtts(loadedAtts, clientAtts, preProcessData) {
    const { client, config } = preProcessData;
    if (!client) {
      return loadedAtts;
    }
    const mutConfig = await client.postProcessAtts(loadedAtts, clientAtts, config);
    if (mutConfig != null) {
      return {
        client,
        config: mutConfig
      };
    }
    return null;
  }

  async prepareMutation(attributes, mutClientData) {
    const { client, config } = mutClientData;
    return client.prepareMutation(attributes, config);
  }

  isPersisted(mutClientData) {
    const { client, config } = mutClientData;
    return client.isPersisted(config);
  }

  /**
   * @param {RecordsClient} client
   */
  register(client) {
    this._clientsByType[client.getType()] = client;
  }
}
