import type RecordsClient from './RecordsClient';

export default class RecordsClientManager {
  private _clientsByType: Record<string, RecordsClient>;

  constructor() {
    this._clientsByType = {};
  }

  init(records: any): void {
    for (const type in this._clientsByType) {
      if (!this._clientsByType.hasOwnProperty(type)) {
        continue;
      }
      const client = this._clientsByType[type] as any;
      if (client.init) {
        client.init(records);
      }
    }
  }

  /**
   * @param sourceId - Records source id
   * @param attsToLoad - attributes to load
   *
   * TODO: Implement optimized logic to fetch client info with fewer requests
   */
  async preProcessAtts(sourceId: string | null, attsToLoad: string[]): Promise<any> {
    return null;
  }

  async postProcessAtts(loadedAtts: any, clientAtts: Record<string, string>, preProcessData: any): Promise<any> {
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

  async prepareMutation(attributes: Record<string, any>, mutClientData: any): Promise<any> {
    const { client, config } = mutClientData;
    return client.prepareMutation(attributes, config);
  }

  isPersisted(mutClientData: any): boolean {
    const { client, config } = mutClientData;
    return client.isPersisted(config);
  }

  register(client: RecordsClient): void {
    this._clientsByType[client.getType()] = client;
  }
}
