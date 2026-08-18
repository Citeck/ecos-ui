import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_CONTAINS, PREDICATE_OR } from '@citeck/records-core/predicates/predicates';
import get from 'lodash/get';
import isArray from 'lodash/isArray';

/**
 * "Show only linked records" (onlyLinked) config of a journal-like widget.
 *
 * The flag and the attribute list are stored per journal (`onlyLinkedJournals[journalId]`,
 * `attrsToLoad[journalId]`) with a legacy flat fallback (`onlyLinked`, `attrsToLoad`) kept for
 * configs saved before the per-journal format appeared.
 *
 * @param {Object} config - dashlet config (JOURNAL_DASHLET_CONFIG_VERSION slice)
 * @param {String} [journalId]
 * @returns {{ onlyLinked: Boolean|undefined, attrsToLoad: Array<{value: String, label?: String}>|undefined }}
 */
/**
 * The journal id whose per-journal only-linked entries `getOnlyLinkedConfig` should read — the one
 * input that decides which settings apply, shared by the journal and kanban sagas so the two views
 * of one dashlet can never resolve different settings.
 *
 * @param {Object} config - dashlet config (JOURNAL_DASHLET_CONFIG_VERSION slice)
 * @param {Object} [journalConfig] - resolved journal config (fallback source of the id)
 * @returns {String|undefined}
 */
export function resolveOnlyLinkedJournalId(config, journalConfig) {
  const { id } = journalConfig || {};
  const { customJournalMode, customJournal } = config || {};

  return customJournalMode ? customJournal : get(config, 'journalId', id && id.includes('@') ? id.split('@')[1] : id);
}

export function getOnlyLinkedConfig(config, journalId) {
  const onlyLinked = get(config, ['onlyLinkedJournals', journalId]) ?? get(config, 'onlyLinked');

  let attrsToLoad;
  if (journalId && isArray(get(config, ['attrsToLoad', journalId]))) {
    attrsToLoad = get(config, ['attrsToLoad', journalId]);
  } else {
    attrsToLoad = get(config, 'attrsToLoad');
  }

  return { onlyLinked, attrsToLoad };
}

/**
 * Predicate for the REVERSE side of the "only linked records" filter: keep the records whose own
 * association attribute points at `recordRef` — `OR[CONTAINS(attr, recordRef)]`.
 *
 * The direct side (the current record points at the records) is resolved separately by loading
 * `attr[]?id` from the record and filtering by id — see `IJournalsApi.fetchLinkedRefs`.
 *
 * Pure and synchronous: mask substitution (`${...}`) in the resulting predicate is the caller's
 * job (`RecordUtils.replaceAttrValuesForRecord`), because the journal data loader runs it over the
 * whole predicate list at once.
 *
 * @param {Object} params
 * @param {Boolean} params.onlyLinked
 * @param {Array<{value: String}>} [params.attrsToLoad] - attributes chosen in the widget settings
 * @param {String} params.recordRef - the record the widget is placed on
 * @param {Array<Object>} [params.columns] - journal columns, used in custom journal mode
 * @param {Boolean} [params.isCustomJournalMode] - no explicit attrsToLoad: use all searchable assoc columns
 * @returns {?Object} predicate or null when the filter is not applicable
 */
export function buildOnlyLinkedPredicate({ onlyLinked, attrsToLoad, recordRef, columns = [], isCustomJournalMode = false }) {
  if (!onlyLinked || !recordRef) {
    return null;
  }

  const mapToPredicates = a => ({
    t: PREDICATE_CONTAINS,
    val: recordRef,
    att: a.attribute
  });

  if (!isCustomJournalMode && isArray(attrsToLoad)) {
    return {
      t: PREDICATE_OR,
      val: attrsToLoad.map(attr => mapToPredicates({ attribute: attr.value }))
    };
  }

  if (isCustomJournalMode) {
    return {
      t: PREDICATE_OR,
      val: (columns || []).filter(c => c.type === COLUMN_DATA_TYPE_ASSOC && c.searchable).map(mapToPredicates)
    };
  }

  return null;
}
