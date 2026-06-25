/**
 * Normalizes a Kaoto topology node id into our `pathId` (Task CTS-2 + click-to-source fix).
 *
 * Click-to-source (see the kaoto-visual-editing-flag plan, CTS track): clicking a canvas node
 * yields an id of the form `` `${entityId}|${modelPath}` `` (the same id as in PatternFly's `SELECTION_EVENT`).
 * To find the YAML line, this id is converted to the `buildPathLineMap` key format (CTS-1) —
 * `` `${docIndex}.${modelPath}` `` (format: array-path joined by '.'), where
 * `docIndex` is the index in the raw top-level YAML array SPECIFICALLY.
 *
 * Facts:
 *   - node id = `` `${entityId}|${modelPath}` `` (e.g. `route-spiketest|route.from.steps.0.to`);
 *   - `modelPath` (after `|`) matches our `dslPath`/`pathId` 1:1; the `route.from` ↔ shorthand
 *     `from` form is smoothed over in `lookupPathLine` during the line lookup;
 *   - `entityId` = `route.id` from YAML if set, otherwise a generated `` `${kind}-${NNNN}` ``
 *     (`getCamelRandomId`), e.g. `route-3814` / `onException-12`;
 *   - edges are ids of the form `id1 >>> id2` → not needed for navigation.
 *
 * IMPORTANT (the bug we're fixing): in Kaoto 2.9.0 `visualEntities` are NOT in document order —
 * `EntityOrderingService` groups them by type (Route, OnException, … Beans last) and
 * drops non-visual ones (`beans`). So the position in `visualEntities` ≠ index in YAML. Therefore
 * the real `docIndex` is reconstructed from the top-level meta (`buildTopLevelMeta`):
 *   1. if `entityId` matched an explicit YAML element id — take its index directly;
 *   2. otherwise (generated id) determine the kind from the prefix, count the entity's position among ITS OWN
 *      kind in `visualEntities` (within a group Kaoto keeps document order) and take the index of the Nth
 *      element of that kind in YAML.
 */

const EDGE_SEPARATOR = ' >>> ';

// A Kaoto-generated id looks like `` `${kind}-${1..4 digits}` `` (`getCamelRandomId`).
// Returns the kind (with `from`→`route` normalization) or null if the id doesn't look generated.
function generatedIdKind(id) {
  const m = /^(.+)-\d{1,4}$/.exec(id);
  if (!m) {
    return null;
  }
  return m[1] === 'from' ? 'route' : m[1];
}

// Entity kind by its id: explicit id → from meta, otherwise from the generated id's prefix.
function entityKind(id, meta) {
  if (id != null && Object.prototype.hasOwnProperty.call(meta.idToKind, id)) {
    return meta.idToKind[id];
  }
  return id ? generatedIdKind(id) : null;
}

/**
 * Reconstructs the entity's index in the raw top-level YAML array.
 *
 * @param {string} entityId entity id (the node id part before `|`)
 * @param {Array<{id: string}>} visualEntities the `EntitiesContext.visualEntities` list (Kaoto order)
 * @param {{idToIndex: Object, idToKind: Object, kindToIndices: Object}} meta meta from `buildTopLevelMeta`
 * @returns {number|null} index in the YAML document or `null`
 */
function resolveDocIndex(entityId, visualEntities, meta) {
  // 1. Explicit id (`route.id`/`onException.id`) → document index directly. Ambiguous ids
  // (multiple elements with the same `id:`) are skipped — idToIndex is unreliable for them, so we fall
  // through to the positional fallback below.
  if (
    Object.prototype.hasOwnProperty.call(meta.idToIndex, entityId) &&
    !(meta.ambiguousIds && meta.ambiguousIds.has(entityId))
  ) {
    return meta.idToIndex[entityId];
  }
  // 2. Generated id → kind from the prefix + position among its own kind (document order).
  const kind = entityKind(entityId, meta);
  if (!kind) {
    return null;
  }
  const groupIndices = meta.kindToIndices[kind];
  if (!groupIndices || !groupIndices.length) {
    return null;
  }
  const arrayIndex = visualEntities.findIndex(entity => entity && entity.id === entityId);
  if (arrayIndex < 0) {
    return null;
  }
  // How many entities of the SAME kind come before the clicked one in `visualEntities` (= its ordinal
  // position in YAML among that kind, since Kaoto preserves document order within a group).
  let posInKind = 0;
  for (let k = 0; k < arrayIndex; k++) {
    const e = visualEntities[k];
    if (e && entityKind(e.id, meta) === kind) {
      posInKind++;
    }
  }
  if (posInKind >= groupIndices.length) {
    return null;
  }
  return groupIndices[posInKind];
}

/**
 * Normalizes the path's root segment to the `buildPathLineMap` format.
 *
 * `modelPath` comes from Kaoto 1:1 with `dslPath`, so this is usually a no-op. Defensively trim
 * leading/trailing dots and collapse duplicates — in case ids become unstable on a Kaoto bump.
 * The `route.from` ↔ shorthand `from` forms BOTH pass through as-is: they already match what's
 * actually in YAML (and hence the line map keys).
 *
 * @param {string} modelPath the node id part after `|`
 * @returns {string} the normalized modelPath
 */
function normalizeModelPath(modelPath) {
  return modelPath
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .replace(/\.{2,}/g, '.');
}

/**
 * Converts a Kaoto topology node id into a `pathId` compatible with `buildPathLineMap` keys.
 *
 * @param {string} nodeId node/edge id from `SELECTION_EVENT` (`` `${entityId}|${modelPath}` ``)
 * @param {Array<{id: string}>} visualEntities `EntitiesContext.visualEntities` (Kaoto order, NOT document order)
 * @param {{idToIndex: Object, idToKind: Object, kindToIndices: Object}} topLevelMeta meta from `buildTopLevelMeta`
 * @returns {string|null} `` `${docIndex}.${modelPath}` `` or `null` if the id is an edge/unknown entity/garbage
 */
export function kaotoNodeIdToPathId(nodeId, visualEntities, topLevelMeta) {
  if (!nodeId || typeof nodeId !== 'string') {
    return null;
  }
  // Edges (`id1 >>> id2`) are not nodes — nowhere to navigate.
  if (nodeId.includes(EDGE_SEPARATOR)) {
    return null;
  }

  const sepIdx = nodeId.indexOf('|');
  if (sepIdx <= 0) {
    return null;
  }

  const entityId = nodeId.slice(0, sepIdx);
  const rawModelPath = nodeId.slice(sepIdx + 1);
  if (!entityId || !rawModelPath) {
    return null;
  }

  const entities = Array.isArray(visualEntities) ? visualEntities : [];
  const meta = topLevelMeta || { idToIndex: {}, idToKind: {}, kindToIndices: {}, ambiguousIds: new Set() };
  const docIndex = resolveDocIndex(entityId, entities, meta);
  if (docIndex == null) {
    return null;
  }

  const modelPath = normalizeModelPath(rawModelPath);
  if (!modelPath) {
    return null;
  }

  return `${docIndex}.${modelPath}`;
}

/**
 * Looks up the line for `pathId` in the `buildPathLineMap` map, smoothing over the root-prefix mismatch.
 *
 * Kaoto builds the node id from `ROOT_PATH = 'route'` (`camel-route-visual-entity.js`), so
 * `modelPath` ALWAYS starts with `route.from…` — even when the YAML is written in the shorthand form
 * `- from:` (Kaoto expands it into a route definition internally). But `buildPathLineMap` keys
 * lines by the actual Monaco text, where shorthand produces `from…` keys (without `route`). A direct
 * lookup then misses. So on a miss we try the shorthand form of the key:
 *   - `<i>.route.from…` → `<i>.from…` (step body in a shorthand route);
 *   - `<i>.route`       → `<i>`        (click on the group node of a shorthand route).
 *
 * For the `- route:` form the map already contains `route` keys — the direct lookup works, no fallback needed.
 *
 * @param {Object<string, number>} pathLineMap map from `buildPathLineMap`
 * @param {string} pathId normalized node id (`<arrayIndex>.<modelPath>`)
 * @returns {number|null} line number (1-based) or `null`
 */
export function lookupPathLine(pathLineMap, pathId) {
  if (!pathLineMap || !pathId) {
    return null;
  }
  if (pathLineMap[pathId] != null) {
    return pathLineMap[pathId];
  }
  const shorthand = pathId.replace(/^(\d+)\.route\.from(\.|$)/, '$1.from$2').replace(/^(\d+)\.route$/, '$1');
  if (shorthand !== pathId && pathLineMap[shorthand] != null) {
    return pathLineMap[shorthand];
  }
  return null;
}
