import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';

const BINDING_KEYS = ['component', 'path', 'components'];
// Provenance lives only on a field's current inline error and disappears when validation clears
// it. This is not a form-level error cache: it lets a full delivery remain one summary entry
// while each field owns only its own validity/binding.
const INLINE_ERROR_SOURCE = Symbol('inlineErrorSource');

export function getErrorBindings(error) {
  return [...(error.components || []), ...(error.component ? [error.component] : []), ...(error.path ? [error.path] : [])];
}

// Match only references (or literal paths), never schemas by key/deep equality: datagrid rows
// can have the same key and schema while still being different invalid field instances.
function sameBinding(left, right, components) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((binding, index) => sameBinding(binding, right[index], components))
    );
  }
  if (left !== right) {
    return false;
  }
  const matches = components.filter(component =>
    typeof left === 'string' ? component.component.key === left : component === left || component.component === left
  );
  return matches.length <= 1;
}

export function sameBoundError(left, right, components) {
  if (left === right) {
    return true;
  }
  if ((left.message || left) !== (right.message || right)) {
    return false;
  }
  return (
    BINDING_KEYS.every(key =>
      // A literal array path addresses the whole lookup result, including all datagrid rows.
      key === 'path' && Array.isArray(left.path) && Array.isArray(right.path)
        ? isEqual(left.path, right.path)
        : sameBinding(left[key], right[key], components)
    ) && isEqual(omit(left, BINDING_KEYS), omit(right, BINDING_KEYS))
  );
}

/** Store multi-target deliveries with field-local bindings, retaining their original metadata. */
export function createInlineError(error, component, targets) {
  if (targets.length < 2) {
    return error;
  }
  const inlineError = { ...omit(error, BINDING_KEYS), message: error.message, component: component.component };
  Object.defineProperty(inlineError, INLINE_ERROR_SOURCE, { value: { error, targets } });
  return inlineError;
}

/** Reassemble a multi-target summary only while all its inline owners are still invalid. */
export function collectInlineErrors(errors, deliveries, components) {
  const groups = new Map();
  const result = [];
  errors.forEach(error => {
    const source = error[INLINE_ERROR_SOURCE];
    if (!source) {
      result.push(error);
      return;
    }
    if (!groups.has(source.error)) {
      groups.set(source.error, { source, errors: new Set() });
    }
    groups.get(source.error).errors.add(error);
  });

  groups.forEach(({ source, errors: localErrors }) => {
    const complete = source.targets.every(
      component => components.includes(component) && component.error && component.error[INLINE_ERROR_SOURCE]?.error === source.error
    );
    const redelivered = deliveries.some(error => sameBoundError(source.error, error, components));
    if (complete || redelivered) {
      result.push(source.error);
    } else if (localErrors.size === 1) {
      // Do not expose the internal full-delivery provenance on a narrowed summary entry.
      result.push({ ...[...localErrors][0] });
    } else {
      result.push({
        ...omit(source.error, BINDING_KEYS),
        message: source.error.message,
        components: [...localErrors].map(error => error.component)
      });
    }
  });
  return result;
}

/** One-level details unwrapping mirrors onSubmissionError, including on the direct save-error path. */
export function toErrorArray(error) {
  if (!error) {
    return [];
  }
  const value = !Array.isArray(error) && typeof error === 'object' && 'details' in error ? error.details : error;
  return Array.isArray(value) ? value : value ? [value] : [];
}

/** Stateless reconciliation: retain the original bound object and all of its metadata. */
export function reconcileErrors(errors, components) {
  const entries = errors.filter(Boolean).map(error => ({
    error,
    message: error.message || error,
    bound: getErrorBindings(error).length > 0
  }));
  const boundMessages = new Set(entries.filter(entry => entry.bound).map(entry => entry.message));
  const result = [];

  entries.forEach(entry => {
    if (!entry.bound && boundMessages.has(entry.message)) {
      return;
    }
    const duplicate = result.some(
      previous =>
        previous.message === entry.message &&
        previous.bound === entry.bound &&
        (!entry.bound || sameBoundError(previous.error, entry.error, components))
    );
    if (!duplicate) {
      result.push(entry);
    }
  });
  return result.map(entry => entry.error);
}
