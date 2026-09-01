export type KanbanSettingsColumnType = {
  id: string;
  name: string;
  default: boolean;
};

export type SwimlaneCellData = {
  records: Array<any>;
  totalCount: number;
  error?: string;
  pagination: { skipCount: number; maxItems: number; page: number };
  isLoading: boolean;
};

export type SwimlaneData = {
  id: string;
  label: string;
  isCollapsed: boolean;
  cells: { [statusId: string]: SwimlaneCellData };
};

/**
 * "Show only linked records" predicate of the board, resolved once per board load and kept in the
 * kanban store: `id EQ [...]` for a direct association, `OR[CONTAINS(attr, recordRef)]` for a reverse
 * one, `null` when the widget is not filtered by a record.
 */
export type KanbanRelatedFilter = {
  t: string;
  att?: string;
  val?: unknown;
} | null;

export type SwimlaneGrouping = {
  attribute: string;
  label: string;
} | null;
