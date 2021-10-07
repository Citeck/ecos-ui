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

    const appName = sourceId.substring(0, appDelimIdx);
    const localSourceId = sourceId.substring(appDelimIdx + 1);

    const sessionCacheKey = 'rc-client-' + sourceId;
    const sessionCachedInfo = sessionStorage.getItem(sessionCacheKey);
    if (sessionCachedInfo) {
      const info = JSON.parse(sessionCachedInfo);
      if (!info.data) {
        sessionStorage.removeItem(sessionCacheKey);
      } else {
        this._clientInfoBySourceId[sourceId] = info.data;
        // update client info in background
        this.requestClientInfo(sourceId, appName, localSourceId, sessionCacheKey);
        return info.data;
      }
    }

    this._clientInfoBySourceId[sourceId] = this.requestClientInfo(sourceId, appName, localSourceId, sessionCacheKey);
  }

  requestClientInfo(sourceId, appName, localSourceId, sessionCacheKey) {
    return new Promise((resolve, reject) => {
      this._records
        .get(appName + '/src@' + localSourceId)
        .load('client{type,config?json}')
        .then(clientInfo => {
          if (!clientInfo || !clientInfo.type) {
            clientInfo = {};
            sessionStorage.setItem(
              sessionCacheKey,
              JSON.stringify({
                data: clientInfo
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
