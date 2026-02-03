const openConnection = (dbName = 'citeck', ver = 2) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, ver);

    request.onupgradeneeded = function (event) {
      const db = request.result;

      if (!db.objectStoreNames.contains('pages')) {
        db.createObjectStore('pages', { keyPath: 'pageId' });
      }

      if (!db.objectStoreNames.contains('snippets')) {
        db.createObjectStore('snippets', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = e => {
      console.error(`DB: ${dbName} cannot be created: ${e}`);
      reject(e);
    };
    request.onblocked = e => {
      console.error(`DB: ${dbName} is blocked: ${e}`);
      reject(e);
    };
  });
};

let citeckDB;

const openCiteckDB = async () => {
  citeckDB = await openConnection();
};

const pagesStore = {
  name: 'pages',
  put: function (entity) {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        reject('there is no indexedDB');
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readwrite');
      const pages = transaction.objectStore(this.name);

      const idbRequest = pages.put(entity);

      idbRequest.onsuccess = e => {
        transaction.commit();
      };

      transaction.oncomplete = e => {
        resolve();
      };

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted: ${JSON.stringify(e)}`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  },
  get: function (key) {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        reject('there is no indexedDB');
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readonly');
      const pages = transaction.objectStore(this.name);

      const idbRequest = pages.get(key);

      idbRequest.onsuccess = e => {
        resolve(idbRequest.result);
      };

      transaction.oncomplete = e => {};

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  },
  migrate: function (from, to) {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        resolve();
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readwrite');
      const pages = transaction.objectStore(this.name);

      const idbRequestGetOld = pages.get(from);

      idbRequestGetOld.onsuccess = e => {
        if (!idbRequestGetOld.result) {
          resolve();
          return;
        }

        const oldPageId = idbRequestGetOld.result.pageId;
        idbRequestGetOld.result.pageId = to;

        pages.put(idbRequestGetOld.result);
        pages.delete(oldPageId);
      };

      transaction.oncomplete = e => {
        resolve();
      };

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  }
};

const snippetsStore = {
  name: 'snippets',
  put: function (entity) {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        reject('there is no indexedDB');
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readwrite');
      const store = transaction.objectStore(this.name);

      const idbRequest = store.put(entity);

      idbRequest.onsuccess = () => {
        transaction.commit();
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted: ${JSON.stringify(e)}`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  },
  getAll: function () {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        reject('there is no indexedDB');
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readonly');
      const store = transaction.objectStore(this.name);

      const idbRequest = store.getAll();

      idbRequest.onsuccess = () => {
        resolve(idbRequest.result || []);
      };

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  },
  delete: function (key) {
    return new Promise(async (resolve, reject) => {
      if (!indexedDB) {
        reject('there is no indexedDB');
      }

      if (!citeckDB) {
        await openCiteckDB();
      }

      const transaction = citeckDB.transaction([this.name], 'readwrite');
      const store = transaction.objectStore(this.name);

      store.delete(key);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = e => {
        console.log(`${this.name} transaction is aborted`);
        reject(`${this.name} transaction is failed: ${e}`);
      };
    });
  }
};

export { pagesStore, snippetsStore };
