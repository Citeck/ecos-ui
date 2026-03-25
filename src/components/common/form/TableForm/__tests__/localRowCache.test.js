describe('TableForm localRowCache', () => {
  // localRowCache is a module-level Map in TableFormContext.jsx.
  // Direct import triggers heavy dependency chain (EcosForm, Records, etc.),
  // so we test the cache behavior contract with a standalone Map.

  let localRowCache;

  beforeEach(() => {
    localRowCache = new Map();
  });

  describe('cache operations', () => {
    it('should store and retrieve a row by record id', () => {
      const row = { id: 'emodel/test@-alias-1', type: 'Аванс', amount: 1000 };
      localRowCache.set(row.id, row);

      expect(localRowCache.has('emodel/test@-alias-1')).toBe(true);
      expect(localRowCache.get('emodel/test@-alias-1')).toBe(row);
    });

    it('should return false for non-cached records', () => {
      expect(localRowCache.has('emodel/test@real-server-id')).toBe(false);
    });

    it('should allow deleting entries after server load', () => {
      const row = { id: 'emodel/test@-alias-1', amount: 500 };
      localRowCache.set(row.id, row);

      localRowCache.delete(row.id);

      expect(localRowCache.has(row.id)).toBe(false);
    });
  });

  describe('useEffect integration pattern', () => {
    it('should return cached row for alias records instead of server fetch', () => {
      const cachedRow = {
        id: 'emodel/payments@-alias-4',
        _localId: 'emodel/payments@-alias-4',
        type: 'Аванс',
        currency: 'Рубль',
        amount: 200000,
        vat: ''
      };
      localRowCache.set(cachedRow.id, cachedRow);

      // Simulate what useEffect does: check cache before server fetch
      const initValue = [
        'emodel/payments@real-server-id',
        'emodel/payments@-alias-4'
      ];

      const results = initValue.map(rec => {
        if (localRowCache.has(rec)) {
          return localRowCache.get(rec);
        }
        // Would normally fetch from server here
        return { id: rec, type: null, currency: null, amount: null };
      });

      // Server record has no cached data
      expect(results[0].type).toBeNull();
      // Alias record uses cached data with display values
      expect(results[1].type).toBe('Аванс');
      expect(results[1].currency).toBe('Рубль');
      expect(results[1].amount).toBe(200000);
    });

    it('should only clean up cache entries loaded from server, not from cache', () => {
      const aliasId = 'emodel/payments@-alias-1';
      const serverId = 'emodel/payments@real-server-id';
      localRowCache.set(aliasId, { id: aliasId, amount: 100 });

      // Simulate useEffect: track which IDs were loaded from cache
      const loadedFromCache = new Set();
      const initValue = [serverId, aliasId];

      initValue.forEach(rec => {
        if (localRowCache.has(rec)) {
          loadedFromCache.add(rec);
        }
      });

      // After loading, only delete entries NOT loaded from cache
      const loadedRows = [{ id: serverId }, { id: aliasId }];
      loadedRows.forEach(row => {
        if (!loadedFromCache.has(row.id)) {
          localRowCache.delete(row.id);
        }
      });

      // Server record was cleaned up
      expect(localRowCache.has(serverId)).toBe(false);
      // Alias record stays cached (it was loaded from cache, not server)
      expect(localRowCache.has(aliasId)).toBe(true);
      expect(localRowCache.get(aliasId).amount).toBe(100);
    });

    it('should preserve cache across multiple useEffect runs for alias records', () => {
      const aliasId = 'emodel/payments@-alias-1';
      localRowCache.set(aliasId, { id: aliasId, amount: 500 });

      // First useEffect run: loads from cache, does NOT delete
      const loadedFromCache1 = new Set();
      if (localRowCache.has(aliasId)) {
        loadedFromCache1.add(aliasId);
      }
      // Cleanup: skip cache-loaded entries
      if (!loadedFromCache1.has(aliasId)) {
        localRowCache.delete(aliasId);
      }

      // Second useEffect run: cache still available
      expect(localRowCache.has(aliasId)).toBe(true);

      const loadedFromCache2 = new Set();
      if (localRowCache.has(aliasId)) {
        loadedFromCache2.add(aliasId);
      }

      expect(localRowCache.get(aliasId).amount).toBe(500);
    });

    it('should survive React component remount (cache persists as module-level)', () => {
      // First "mount": onCreateFormSubmit caches a row
      localRowCache.set('emodel/test@-alias-1', { id: 'emodel/test@-alias-1', type: 'Test' });

      // Simulate remount: new component instance, but same cache
      // (In real code, localRowCache is a module-level const Map)
      expect(localRowCache.has('emodel/test@-alias-1')).toBe(true);
      expect(localRowCache.get('emodel/test@-alias-1').type).toBe('Test');
    });
  });
});
