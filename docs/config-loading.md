# Configuration loading

`ConfigService` batches known configuration keys during initialization. With a missing,
expired (over 30 minutes) or locale-incompatible localStorage cache, `getValue` waits
for the pending batch and then reads the requested attribute from the populated cache.
Concurrent readers reuse that batch. A usable cache remains available while its
background refresh runs.

If the requested key or attribute is absent after initialization, `getValue` loads it
separately. `configApi.loadConfigs` returns values under their configuration keys,
not a `result` field. Empty values use the configured defaults; `false` and `0` are
valid values.

The initialization and fallback contracts are covered by
`src/services/config/__tests__/configLoading.test.js`.
