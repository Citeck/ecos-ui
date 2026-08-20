import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';

/** A read that hangs must not block every later soft-reload of the record for the page's life. */
const READ_TIMEOUT_MS = 30000;

function runWithTimeout(task) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('soft-reload read timed out')), READ_TIMEOUT_MS);

    Promise.resolve()
      .then(task)
      .then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
  });
}

/**
 * In-flight soft-reload reads, one chain per record ref — the serialization behind
 * {@link EcosForm#softReload}.
 *
 * One background update fans out to every form on the page that shows the record; records-core
 * batches all their attribute sets into one union query per record id, and the backend fails such
 * a query whole when any one attribute cannot be calculated (e.g. an attribute served by an app
 * that is down) — the per-attribute catch then turns the shared failure into silent nulls for
 * every reader (measured: 40 attributes loaded, 5 non-null, an empty submission). Read one at a
 * time and every reader keeps its own request: a failure stays with the form that owns it.
 */
const readQueues = {};

export function readRecordSequentially(recordRef, readTask) {
  const runTask = () => runWithTimeout(readTask);
  const readPromise = (readQueues[recordRef] || Promise.resolve()).then(runTask, runTask);
  const tail = readPromise.then(
    () => undefined,
    () => undefined
  );

  readQueues[recordRef] = tail;
  tail.then(() => {
    if (readQueues[recordRef] === tail) {
      delete readQueues[recordRef];
    }
  });

  return readPromise;
}

/**
 * Repaints the given form components by key.
 *
 * `setValue` refreshes the model, but in read-only `viewAsHtml` mode a component renders its value
 * into static markup that is built once, so without an explicit redraw the form keeps showing the
 * previous value. Only the components whose value has actually changed are repainted — that is the
 * whole point of the soft reload.
 */
export function redrawComponents(form, keys) {
  if (!form || isEmpty(keys) || !isFunction(form.getAllComponents)) {
    return;
  }

  const changedKeys = new Set(keys);

  form.getAllComponents().forEach(component => {
    if (changedKeys.has(get(component, 'component.key')) && isFunction(component.redraw)) {
      component.redraw();
    }
  });
}

/**
 * The diff-and-patch half of {@link EcosForm#softReload}, over plain data.
 *
 * Compared with the previous server snapshot rather than with the live form data: formio
 * normalizes values as it renders them, so the same record read twice is equal here, while a
 * comparison against the form would report a difference on every single update.
 *
 * Three subtleties the patch carries:
 * - a value cleared on the server has NO key in the new submission at all (null attributes are
 *   skipped in post-processing) — such keys are reset to `null` explicitly, or the spread would
 *   keep the stale value on screen forever;
 * - keys the form owns but the record does not (buttons, client-only and computed components)
 *   are merged over, not reset to defaults;
 * - a key the user is editing inline right now is theirs, not the server's: it is left with the
 *   live form's value, excluded from the patchable set, and kept at its previous snapshot value
 *   in `nextLoadedData` — so the skipped delta is re-detected by the next diff once the editor
 *   closes.
 *
 * `redrawKeys` is the narrower set that has to be repainted: a key can differ from the previous
 * SNAPSHOT and still be exactly what the form already shows — that is every inline save, whose
 * follow-up re-read confirms the value the user has just typed. Repainting it tears the freshly
 * rendered field (a rich-text editor's whole React root, for one) down and builds it again for
 * an identical result — the flicker of the edited field.
 * Cause: https://citeck.atlassian.net/browse/COREDEV-427
 */
export function buildSoftPatch({ data, previousData, formData = {}, inlineEditedKeys = new Set() }) {
  const changedKeys = [...new Set([...Object.keys(data), ...Object.keys(previousData)])].filter(
    key => !isEqual(data[key], previousData[key])
  );
  const patchableKeys = changedKeys.filter(key => !inlineEditedKeys.has(key));

  const patchData = { ...formData, ...data };
  const nextLoadedData = { ...data };

  patchableKeys.forEach(key => {
    if (!(key in data) && key in previousData) {
      patchData[key] = null;
    }
  });

  // Driven by the edited keys themselves, not by the changed ones: `{ ...formData, ...data }`
  // has already put the SERVER value over the user's typing for every key the read returned —
  // including keys the server did not change at all — so every open editor's key must be put
  // back, changed on the server or not.
  inlineEditedKeys.forEach(key => {
    if (key in formData) {
      patchData[key] = formData[key];
    } else {
      delete patchData[key];
    }

    if (key in previousData) {
      nextLoadedData[key] = previousData[key];
    } else {
      delete nextLoadedData[key];
    }
  });

  const redrawKeys = patchableKeys.filter(key => !isEqual(patchData[key], formData[key]));

  return { changedKeys, patchableKeys, redrawKeys, patchData, nextLoadedData };
}
