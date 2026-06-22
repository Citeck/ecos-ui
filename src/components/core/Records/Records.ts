/**
 * Compatibility shim.
 *
 * The Records core was extracted to `@citeck/records-core`. This re-export keeps
 * the git submodule `ecos-ui-gantt-chart-widget-plugin` building unchanged while
 * it still imports `@/components/Records/Records`. New host code must import from
 * `@citeck/records-core` directly. Remove once the submodule migrates.
 */
export { default, registerGlobal } from '@citeck/records-core';
export type { RecordsContainerType, RecordType } from '@citeck/records-core';
