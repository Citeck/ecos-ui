import ClientInfoService from './ClientInfoService';

export default class RecordsClientManager {
  constructor() {
    this._clientsByType = {};
    this._clientInfoService = new ClientInfoService();
  }

  init(records) {
    this._clientInfoService.init(records);
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
   */
  async preProcessAtts(sourceId, attsToLoad) {
    if (!sourceId || sourceId.indexOf('/') === -1) {
      return null;
    }
    const { client, config } = await this._getClient(sourceId);
    if (!client) {
      return null;
    }
    const result = await client.preProcessAtts(attsToLoad, config);
    if (result == null) {
      return null;
    }
    return {
      clientAtts: result.clientAtts,
      config: result.config || config,
      client
    };
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

  async _getClient(sourceId) {
    const clientInfo = await this._clientInfoService.getClientInfo(sourceId);
    if (!clientInfo || !clientInfo.type) {
      return {};
    }
    const client = this._clientsByType[clientInfo.type];
    if (!client) {
      console.warn('Client with type ' + clientInfo.type + ' is not registered. SourceId: ' + sourceId);
      return {};
    }
    return { client, config: clientInfo.config || {} };
  }

  /**
   * @param {RecordsClient} client
   */
  register(client) {
    this._clientsByType[client.getType()] = client;
  }
}
