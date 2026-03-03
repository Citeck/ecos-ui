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

export type SwimlaneGrouping = {
  attribute: string;
  label: string;
} | null;
