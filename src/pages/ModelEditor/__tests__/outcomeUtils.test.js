import { MAX_OUTCOME_SEARCH_DEPTH, OUTCOMES_ATTR, findOutcomeSource } from '../outcomeUtils';

// Minimal bpmn-js-like element factory. A flow's `source` points at the upstream
// element; an element's `incoming` is the list of flows entering it.
const outcomes = [
  { id: 'accept', name: { en: 'Accept' } },
  { id: 'reject', name: { en: 'Reject' } }
];

const withOutcomes = (id, list = outcomes) => ({
  id,
  businessObject: { $attrs: { [OUTCOMES_ATTR]: JSON.stringify(list) } }
});

const plain = id => ({ id, businessObject: { $attrs: {} } });

// Chain an element after its predecessor via a single incoming sequence flow.
const chain = (element, predecessor) => {
  element.incoming = predecessor ? [{ id: `flow_${predecessor.id}_${element.id}`, source: predecessor }] : [];
  return element;
};

// Give an element several incoming sequence flows (a merge point).
const merge = (element, predecessors) => {
  element.incoming = predecessors.map(p => ({ id: `flow_${p.id}_${element.id}`, source: p }));
  return element;
};

// Build a linear path where elements[0] is the start and each next element is its
// upstream predecessor. Returns the start element.
const linear = elements => {
  elements.forEach((el, i) => chain(el, elements[i + 1] || null));
  return elements[0];
};

describe('findOutcomeSource', () => {
  it('returns the element itself when it carries outcomes', () => {
    const userTask = chain(withOutcomes('userTask'), null);

    const result = findOutcomeSource(userTask);

    expect(result.source.id).toBe('userTask');
    expect(result.outcomes).toHaveLength(2);
  });

  it('walks past an intermediate script task to reach the user task outcomes', () => {
    const userTask = chain(withOutcomes('userTask'), null);
    const scriptTask = chain(plain('scriptTask'), userTask);

    // scriptTask sits between the user task and the gateway and has no outcomes.
    const result = findOutcomeSource(scriptTask);

    expect(result.source.id).toBe('userTask');
    expect(result.outcomes.map(o => o.id)).toEqual(['accept', 'reject']);
  });

  it('walks past several intermediate blocks', () => {
    const userTask = chain(withOutcomes('userTask'), null);
    const scriptTask = chain(plain('scriptTask'), userTask);
    const serviceTask = chain(plain('serviceTask'), scriptTask);

    const result = findOutcomeSource(serviceTask);

    expect(result.source.id).toBe('userTask');
  });

  it('returns null when no upstream element has outcomes', () => {
    const start = chain(plain('start'), null);
    const scriptTask = chain(plain('scriptTask'), start);

    expect(findOutcomeSource(scriptTask)).toBeNull();
  });

  it('stops the search at a merging gateway with several incoming paths', () => {
    const userTaskA = chain(withOutcomes('userTaskA'), null);
    const userTaskB = chain(withOutcomes('userTaskB'), null);
    // Merge gateway joins two branches — the upstream user task is ambiguous.
    const mergeGateway = merge(plain('mergeGateway'), [userTaskA, userTaskB]);
    const scriptTask = chain(plain('scriptTask'), mergeGateway);

    expect(findOutcomeSource(scriptTask)).toBeNull();
  });

  it('still returns outcomes of a merge point that itself carries outcomes', () => {
    const a = chain(plain('a'), null);
    const b = chain(plain('b'), null);
    // Element has multiple incoming flows but defines its own outcomes.
    const userTask = merge(withOutcomes('userTask'), [a, b]);

    const result = findOutcomeSource(userTask);

    expect(result.source.id).toBe('userTask');
  });

  it('finds outcomes at the last inspected block within the depth limit', () => {
    const intermediates = Array.from({ length: MAX_OUTCOME_SEARCH_DEPTH - 1 }, (_, i) => plain(`block${i}`));
    const start = linear([...intermediates, withOutcomes('userTask')]);

    expect(findOutcomeSource(start).source.id).toBe('userTask');
  });

  it('gives up when the outcome-bearing block is beyond the depth limit', () => {
    const intermediates = Array.from({ length: MAX_OUTCOME_SEARCH_DEPTH }, (_, i) => plain(`block${i}`));
    const start = linear([...intermediates, withOutcomes('userTask')]);

    expect(findOutcomeSource(start)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(findOutcomeSource(undefined)).toBeNull();
    expect(findOutcomeSource(null)).toBeNull();
  });

  it('does not loop forever on a cyclic flow', () => {
    const a = plain('a');
    const b = plain('b');
    chain(a, b);
    chain(b, a);

    expect(findOutcomeSource(a)).toBeNull();
  });
});
