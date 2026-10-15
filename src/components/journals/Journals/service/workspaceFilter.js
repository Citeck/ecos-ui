const WORKSPACE_ATTRIBUTE = '_workspace';
const SELECTION_OPERATORS = ['contains', 'eq', 'in'];

const workspaceId = value => value.slice(value.indexOf('@') + 1);

/**
 * Workspace selection is an AND constraint on RecordsQuery.workspaces, not a stored attribute.
 * Do not lift selections out of OR/NOT: workspace leaves in those groups are ignored.
 * An empty intersection must be false, since workspaces: [] means all accessible workspaces.
 */
export function applyWorkspaceFilter(predicates, workspaces) {
  let selected = null;

  function strip(predicate, conjunctive = true) {
    if (!predicate || !predicate.t) {
      return predicate;
    }
    if (predicate.att === WORKSPACE_ATTRIBUTE) {
      if (conjunctive && !SELECTION_OPERATORS.includes(predicate.t)) {
        return predicate;
      }
      if (conjunctive && SELECTION_OPERATORS.includes(predicate.t)) {
        const values = Array.isArray(predicate.val) ? predicate.val : [predicate.val];
        const ids = [
          ...new Set(
            values
              .filter(value => typeof value === 'string' && value.length)
              .map(workspaceId)
              .filter(Boolean)
          )
        ];
        selected = selected === null ? ids : selected.filter(id => ids.includes(id));
      }
      return null;
    }
    if (predicate.t === 'and' || predicate.t === 'or') {
      // Header filters arrive inside nested one-branch OR wrappers; these are not alternatives.
      const children = predicate.val || [];
      const isConjunction = predicate.t === 'and' || children.length === 1;
      const val = children.map(child => strip(child, conjunctive && isConjunction)).filter(Boolean);
      return val.length ? { ...predicate, val } : null;
    }
    if (predicate.t === 'not') {
      const val = strip(predicate.val, false);
      return val ? { ...predicate, val } : null;
    }
    return predicate;
  }

  const filtered = predicates.map(predicate => strip(predicate)).filter(Boolean);
  if (selected === null) {
    return { predicates: filtered, workspaces };
  }
  if (workspaces.length) {
    const scope = workspaces.map(workspaceId);
    selected = selected.filter(id => scope.includes(id));
  }
  if (!selected.length) {
    filtered.push({ t: 'not', val: { t: 'and', val: [] } });
  }
  return { predicates: filtered, workspaces: selected };
}
