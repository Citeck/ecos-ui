import { KEY_FIELD_OUTCOMES, PREFIX_FIELD } from '@citeck/constants/cmmn';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

export const OUTCOMES_ATTR = PREFIX_FIELD + KEY_FIELD_OUTCOMES;

// How many blocks to inspect while walking backwards before giving up.
export const MAX_OUTCOME_SEARCH_DEPTH = 5;

/**
 * Walk backwards from a diagram element through its single incoming flow until an
 * element carrying a non-empty `ecos:outcomes` attribute is found. This skips any
 * intermediate blocks (script/service tasks, events, gateways, ...) that may sit
 * between the outcome-bearing user task and the gateway.
 *
 * The walk stops at a merge point — an element with more than one incoming flow
 * (e.g. a merging gateway): the upstream path is ambiguous there, so we cannot
 * attribute the outcomes to a single user task and return null instead.
 *
 * The walk also gives up after inspecting `MAX_OUTCOME_SEARCH_DEPTH` blocks.
 *
 * @param {object} element bpmn-js diagram element to start from (inclusive).
 * @param {Set<string>} visited guards against cyclic flows and bounds the depth.
 * @returns {{ source: object, outcomes: Array }|null} the nearest outcome-bearing
 *   element and its parsed outcomes, or null when none is found.
 */
export const findOutcomeSource = (element, visited = new Set()) => {
  if (isEmpty(element) || visited.has(element.id) || visited.size >= MAX_OUTCOME_SEARCH_DEPTH) {
    return null;
  }

  visited.add(element.id);

  const rawOutcomes = get(element, `businessObject.$attrs["${OUTCOMES_ATTR}"]`);

  if (!isEmpty(rawOutcomes)) {
    return { source: element, outcomes: JSON.parse(rawOutcomes) };
  }

  const incoming = get(element, 'incoming', []);

  if (incoming.length > 1) {
    return null;
  }

  return findOutcomeSource(get(incoming, '[0].source'), visited);
};
