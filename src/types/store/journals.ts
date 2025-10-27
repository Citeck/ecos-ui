import { IJournalsApi } from '@/api/journals';
import {
  ApiJournalConfigJsonType,
  JournalColumnType,
  JournalConfigMetaType,
  JournalCreateVariantType,
  SortByType
} from '@/api/journals/types';
import { WidgetsConfigType } from '@/components/Journals/JournalsPreviewWidgets/JournalsPreviewWidgets';
import { JOURNAL_VIEW_MODE } from '@/components/Journals/constants';
import { MLTextType } from '@/types/components';
import { PredicateType } from '@/types/predicates';
import { ExtraArgumentsStore, WrapArgsType } from '@/types/store/index';
import { KanbanSettingsColumnType } from '@/types/store/kanban';

export type PaginationType = {
  maxItems: number;
  skipCount: number;
  page: number;
};

export type GroupingJournalType = {
  columns: JournalColumnType[];
  groupBy: string[];
  needCount: boolean;
};

// journal state -> config
export type JournalConfigType = {
  version: string;
} & Record<string, JournalDashletConfigVersionType>;

export type JournalDashletConfigVersionType = {
  journalId: string;

  aggregateWorkspaces?: string[];
  customJournal?: string;
  customJournalMode?: boolean;
  isHideCreateVariants?: boolean;
  isHideGoToButton?: boolean;
  journalSettingId?: string;
  journalsListIds?: string[];
  searchInWorkspacePolicy?: string;
};

type GridQueryType = {
  consistency: string;
  groupBy: string[];
  language: string;
  page: PaginationType;
  query: PredicateType;
  sortBy: SortByType;
  sourceId: string;
  workspaces: string[];
};

type PropertiesJournalSettingsItemType = {
  columns?: JournalColumnType[];
  groupBy: string[];
  grouping: GroupingJournalType;
  journalSetting: JournalSettingType;
  kanban?: {
    columns: KanbanSettingsColumnType[];
  };
  predicate: PredicateType | null;
  sortBy: SortByType[];
  stateId: string;
};

// item of journal settings (journal -> journalSettings -> [..., { item }, ...])
export type JournalSettingsItemType = {
  authorities: string[];
  authority: string;
  displayName: string;
  editable: boolean;
  id: string;
  journalId: string;
  settings: PropertiesJournalSettingsItemType;
  workspaces?: string[];
  name?: MLTextType;
  kanban?: PropertiesJournalSettingsItemType['kanban'];
};

// journal state -> journalSetting
export type JournalSettingType = Pick<
  PropertiesJournalSettingsItemType,
  'columns' | 'groupBy' | 'grouping' | 'kanban' | 'predicate' | 'sortBy'
> & {
  id?: string;
  isExpandedFromGrouped: boolean;
  needCount: boolean;
  journalSetting?: JournalSettingType;
  search?: string;
  selectedItems?: string[];
  permissions: { Write: boolean };
};

export type ColumnsSetupType = {
  columns: JournalColumnType[];
  isExpandedFromGrouped?: boolean;
  sortBy: SortByType[];
};

type SelectedJournalType = {
  id: string;
  title: string;
};

export type FooterValuesType = NonNullable<unknown> | null;
export type DataGridType = { id: string } & Record<string, Record<string, string> | string>;
export type ViewModeType = (typeof JOURNAL_VIEW_MODE)[keyof typeof JOURNAL_VIEW_MODE];

// full journal state for reducer
export interface IJournalState {
  loading: boolean;
  isCheckLoading?: boolean;
  forceUpdate?: boolean;
  loadingGrid: boolean;
  searching: boolean;
  editorMode: boolean;
  wasChangedSettingsOn: string[];
  viewMode?: ViewModeType;

  url: Record<string, string>;

  widgetsConfig: WidgetsConfigType;
  footerValue: FooterValuesType;

  grid: {
    data: DataGridType[];
    columns: JournalColumnType[];
    isExpandedFromGrouped: boolean;
    total: number;
    createVariants: JournalCreateVariantType[];
    predicate: PredicateType;
    groupBy: string[];
    sortBy: SortByType[];
    pagination: Partial<PaginationType>;
    minHeight: number | null;
    editingRules: Record<string, boolean>;
    search: string;

    actions?: RecordsActionsRes;
    attributes?: Record<string, string>;
    groupActions?: JournalConfigMetaType['groupActions'];
    grouping?: GroupingJournalType;
    journalActions?: string[];
    journalId?: string;
    predicates?: PredicateType[];
    searchPredicate?: PredicateType;
    query?: GridQueryType;
    sourceId?: string;
    fromGroupBy?: boolean;
  };

  grouping: GroupingJournalType;
  journalSettings: JournalSettingsItemType[];
  journalSetting: JournalSettingType;
  breadcrumbs: Awaited<ReturnType<IJournalsApi['fetchBreadcrumbs']>>;

  originGridSettings: {
    isExpandedFromGrouped?: boolean;

    grouping: GroupingJournalType;
    predicate: PredicateType | null;
    columnsSetup: ColumnsSetupType;
  };

  config: JournalConfigType | null;
  initConfig: JournalConfigType | null;
  journalConfig: Partial<ApiJournalConfigJsonType>;
  recordRef: string | null;
  isExistJournal: boolean;
  predicate: PredicateType | null;
  columnsSetup: ColumnsSetupType;

  selectedRecords: string[];
  excludedRecords: string[];
  selectAllPageRecords: boolean;
  selectAllRecordsVisible: boolean;

  selectedJournals: SelectedJournalType[];
}

export interface IInitJournalProps {
  journalId: string;

  force?: boolean;
  savePredicate?: boolean;
  customJournalMode?: boolean;
  customJournal?: string;
  userConfigId?: string;
  journalSettingId?: string;
}

export interface IJournalsExtraArgumentsStore extends ExtraArgumentsStore {
  stateId: string;
  w: <T>(args?: T | null) => WrapArgsType<T>;
}
