const EMPTY_CLIENT_CACHE_TIMEOUT = 14400000; // 1000 * 60 * 60 * 4 = 4 Hours

export default class ClientInfoService {
  constructor() {
    this._clientInfoBySourceId = {};
  }

  init(records) {
    this._records = records;
  }

  async getClientInfo(sourceId) {
    if (!sourceId || sourceId.endsWith('/src')) {
      return {};
    }

    let appDelimIdx = sourceId.indexOf('/');
    if (appDelimIdx === -1) {
      return {};
    }
    const infoFromCache = this._clientInfoBySourceId[sourceId];
    if (infoFromCache) {
      return infoFromCache;
    }

    const sessionCacheKey = 'rc-client-' + sourceId;
    const sessionCachedInfo = sessionStorage.getItem(sessionCacheKey);
    if (sessionCachedInfo) {
      const info = JSON.parse(sessionCachedInfo);
      if (!info.until || !info.data || new Date().getTime() > info.until) {
        sessionStorage.removeItem(sessionCacheKey);
      } else {
        this._clientInfoBySourceId[sourceId] = info.data;
        return info.data;
      }
    }

    this._clientInfoBySourceId[sourceId] = new Promise((resolve, reject) => {
      const appName = sourceId.substring(0, appDelimIdx);
      const localSourceId = sourceId.substring(appDelimIdx + 1);

      return this._records
        .get(appName + '/src@' + localSourceId)
        .load('client{type,config?json}')
        .then(clientInfo => {
          if (!clientInfo || !clientInfo.type) {
            clientInfo = {};
            sessionStorage.setItem(
              sessionCacheKey,
              JSON.stringify({
                data: clientInfo,
                // Records source without custom client can be cached to avoid unnecessary requests.
                until: new Date().getTime() + EMPTY_CLIENT_CACHE_TIMEOUT + (Math.random() - 0.5) * 60000
              })
            );
          }
          this._clientInfoBySourceId[sourceId] = clientInfo;
          resolve(clientInfo);
        })
        .catch(e => {
          this._clientInfoBySourceId[sourceId] = {};
          reject(e);
        });
    });
  }
}
