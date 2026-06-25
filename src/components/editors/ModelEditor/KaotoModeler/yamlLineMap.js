import { parseDocument, LineCounter, isMap, isSeq } from 'yaml';

/**
 * Builds a `pathId → line number` map from the source Camel YAML.
 *
 * Used for click-to-source navigation (see the kaoto-visual-editing-flag plan, CTS track):
 * click on a canvas node → normalized `pathId` (Task CTS-2) → line lookup here → Monaco scroll.
 *
 * Map keys are in the array-path format joined with '.':
 *   - `0.route.from.steps.0.to`            (`- route:` form)
 *   - `0.from.steps.0.to`                  (`- from:` shorthand)
 *   - `0.route.from.steps.1.choice.when.0.steps.0.log` (nested)
 *
 * The path form (`route.from` vs shorthand `from`) reflects what is actually in the YAML —
 * normalizing the Kaoto node id to these keys is done in `kaotoNodeIdToPathId` (CTS-2).
 *
 * The line for a path is taken from the position of the pair's KEY (not its value), since
 * navigation leads to the step declaration line (`- to: log:info` / `- choice:`), not the nested body.
 *
 * Parse-guard: invalid / empty / non-array YAML → empty map (no throw).
 *
 * @param {string} yamlSource source YAML
 * @returns {Object<string, number>} `pathId → line` map (1-based)
 */
export function buildPathLineMap(yamlSource) {
  const map = {};
  if (!yamlSource || typeof yamlSource !== 'string' || !yamlSource.trim()) {
    return map;
  }

  const lineCounter = new LineCounter();
  let doc;
  try {
    doc = parseDocument(yamlSource, { lineCounter });
  } catch (err) {
    return map;
  }
  // parseDocument does not throw on syntax errors — it collects them in doc.errors.
  if (!doc || (doc.errors && doc.errors.length)) {
    return map;
  }

  const root = doc.contents;
  // Camel YAML is an array at the top level (routes / from / beans). Otherwise display nothing.
  if (!isSeq(root)) {
    return map;
  }

  const lineOf = node => {
    if (!node || !Array.isArray(node.range)) return null;
    return lineCounter.linePos(node.range[0]).line;
  };

  const walk = (node, path) => {
    if (isMap(node)) {
      node.items.forEach(pair => {
        if (!pair || pair.key == null) return;
        const key = pair.key.value;
        if (key == null) return;
        const childPath = [...path, key];
        const line = lineOf(pair.key) ?? lineOf(pair.value);
        if (line != null) {
          map[childPath.join('.')] = line;
        }
        walk(pair.value, childPath);
      });
    } else if (isSeq(node)) {
      node.items.forEach((item, i) => {
        const childPath = [...path, i];
        const line = lineOf(item);
        if (line != null) {
          map[childPath.join('.')] = line;
        }
        walk(item, childPath);
      });
    }
  };

  walk(root, []);
  return map;
}

// `- from:` (shorthand) and `- route:` are the same Kaoto route entity; to match a node's
// kind (always from ROOT_PATH='route') against top-level YAML, normalize `from` → `route`.
const KIND_ALIASES = { from: 'route' };

function normalizeTopLevelKind(kind) {
  return KIND_ALIASES[kind] || kind;
}

/**
 * Builds top-level Camel YAML metadata for matching a Kaoto entity to its INDEX IN THE DOCUMENT.
 *
 * Why (see CTS-2 + the click-to-source fix): Kaoto 2.9.0 does NOT return `visualEntities` in
 * document order — `EntityOrderingService` groups them by type (Route, OnException, … Beans last)
 * and drops non-visual ones (`beans`). So an entity's position in `visualEntities` ≠ its index in
 * the raw YAML array that `buildPathLineMap` keys by. To recover the real index:
 *   - `idToIndex`     — explicit `id` of a top-level element (`route.id`, `onException.id`) → its index;
 *   - `idToKind`      — same id → normalized kind (to count its position within its own kind);
 *   - `kindToIndices` — normalized kind → indices of elements of that kind IN DOCUMENT ORDER
 *                       (Kaoto preserves document order WITHIN a group of the same type).
 *
 * Parse-guard: invalid / empty / non-array YAML → empty metadata (no throw).
 *
 * @param {string} yamlSource source YAML
 * @returns {{idToIndex: Object<string, number>, idToKind: Object<string, string>, kindToIndices: Object<string, number[]>}}
 */
export function buildTopLevelMeta(yamlSource) {
  const meta = { idToIndex: {}, idToKind: {}, kindToIndices: {}, ambiguousIds: new Set() };
  if (!yamlSource || typeof yamlSource !== 'string' || !yamlSource.trim()) {
    return meta;
  }

  let doc;
  try {
    doc = parseDocument(yamlSource);
  } catch (err) {
    return meta;
  }
  if (!doc || (doc.errors && doc.errors.length)) {
    return meta;
  }

  const root = doc.contents;
  if (!isSeq(root)) {
    return meta;
  }

  root.items.forEach((item, i) => {
    if (!isMap(item) || !item.items.length) {
      return;
    }
    const firstPair = item.items[0];
    const rawKey = firstPair.key && firstPair.key.value;
    if (rawKey == null) {
      return;
    }
    const kind = normalizeTopLevelKind(String(rawKey));
    if (!meta.kindToIndices[kind]) {
      meta.kindToIndices[kind] = [];
    }
    meta.kindToIndices[kind].push(i);

    // An explicit id (if set in the YAML) matches the Kaoto entity id directly.
    const valNode = firstPair.value;
    if (isMap(valNode)) {
      const idVal = valNode.get('id');
      if (idVal != null && idVal !== '') {
        // A duplicate explicit id (copy-paste of two routes with the same `id:`) — do NOT overwrite
        // silently (otherwise the last one "wins" and clicking the first leads to the wrong line).
        // Mark the id as ambiguous so resolveDocIndex falls back to positional resolution by kind/document order.
        if (idVal in meta.idToIndex) {
          meta.ambiguousIds.add(idVal);
        } else {
          meta.idToIndex[idVal] = i;
          meta.idToKind[idVal] = kind;
        }
      }
    }
  });

  return meta;
}
