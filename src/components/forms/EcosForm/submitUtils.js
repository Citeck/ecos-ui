import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';

/**
 * Duck-typing check for a promise-like value (Promise, thenable of any library).
 *
 * @param {*} value
 * @returns {Boolean}
 */
export function isThenable(value) {
  return !isNil(value) && isFunction(value.then);
}

/**
 * Marker passed by EcosForm as the last argument of `props.onSubmit` when the form delegates
 * saving to the consumer AND awaits its result (`saveOnSubmit: false` without `forceSave`).
 *
 * Only EcosForm knows whether the submission is awaited, so a wrapper around `onSubmit`
 * (EcosFormModal) must rely on this marker instead of guessing by `saveOnSubmit`: with
 * `forceSave` the form saves the record itself and drops the callback result, and a promise
 * awaited by nobody would leave the modal open forever on a rejection.
 *
 * Recognized by reference, not by shape: a look-alike object built elsewhere is not the marker.
 * The property is here to make the argument readable in logs and devtools.
 */
export const AWAITED_SUBMIT = Object.freeze({ isSubmitAwaited: true });

/**
 * @param {*} meta - the last argument of an `onSubmit` callback
 * @returns {Boolean} whether EcosForm awaits the result of that callback
 */
export function isAwaitedSubmit(meta) {
  return meta === AWAITED_SUBMIT;
}

/**
 * Handles the outcome of a form submit callback.
 *
 * A consumer that saves the record itself may report the result of the mutation with a promise.
 * In that case the submission is not over until the promise settles, so the handlers are called
 * asynchronously and the returned promise lets the caller await the whole submission. A consumer
 * returning anything else keeps the submission fully synchronous, as it has always been.
 *
 * When `onError` is omitted a rejection is rethrown, so that an outer caller can handle it.
 * `onSettled` always runs, even if `onSuccess`/`onError` throw.
 *
 * @param {*} submitResult - value returned by the submit callback
 * @param {Object} [handlers]
 * @param {Function} [handlers.onSuccess] - called with the settled result
 * @param {Function} [handlers.onError] - called with the rejection reason
 * @param {Function} [handlers.onSettled] - called in both cases, like `finally`
 * @returns {Promise|*} a promise to await when `submitResult` is thenable, `submitResult` otherwise
 */
export function handleSubmitResult(submitResult, { onSuccess, onError, onSettled } = {}) {
  const settle = () => {
    isFunction(onSettled) && onSettled();
  };

  if (!isThenable(submitResult)) {
    try {
      isFunction(onSuccess) && onSuccess(submitResult);
    } finally {
      settle();
    }

    return submitResult;
  }

  // The same then/catch/finally semantics the form relies on when it saves the record itself:
  // a throw from onSuccess is reported through onError, and onSettled always runs.
  // Promise.resolve normalizes a foreign thenable, which may have no catch/finally of its own.
  const handled = Promise.resolve(submitResult).then(result => {
    isFunction(onSuccess) && onSuccess(result);

    return result;
  });

  return (isFunction(onError) ? handled.catch(onError) : handled).finally(settle);
}
