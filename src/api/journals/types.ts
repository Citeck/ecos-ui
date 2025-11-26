import { ReactNode } from 'react';

import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '@/components/Journals/service/util';
import { MLTextType } from '@/types/components';
import { PredicateType } from '@/types/predicates';

export type JournalCreateVariantType = {
  allowedFor: string[];
  attributes: Record<string, string>;
  formOptions: NonNullable<unknown>;
  forRef: string;
  id: string;
  name: MLTextType;
  postActionRef: string;
  properties: NonNullable<unknown>;
  sourceId: string;
  typeRef: string;
};

type EditorSchemaType = {
  config: NonNullable<unknown>;
  type: string;
};

type SearchConfigType = {
  delimiters: string[];
  searchAttribute?: string;
  searchByText?: {
    innerQuery: NonNullable<unknown>;
    innerQueryAttribute: string;
  };
  headerSearchEnabled?: boolean;
};

export type JournalColumnType = {
  column?: string;
  attSchema: string;
  attribute: string;
  originAttribute?: string;
  computed: unknown[];
  dataField: string;
  default: boolean;
  editable: boolean;
  editorRenderer: (editorProps: NonNullable<unknown>, value: string, row: string) => ReactNode;
  filterValue: (cell: { disp: string } | string) => string;
  formatExtraData: {
    createVariants?: JournalCreateVariantType;
  };
  groupable: boolean;
  hasTotalSumField: boolean;
  headerFilterEditor: EditorSchemaType;
  hidden: boolean;
  label: string;
  multiple: boolean;
  name: string;
  newAttSchema: string;
  originSchema?: string | null;
  newEditor: EditorSchemaType;
  newFormatter: EditorSchemaType;
  newType: keyof typeof COLUMN_TYPE_NEW_TO_LEGACY_MAPPING;
  params: NonNullable<unknown>;
  schema: string;
  searchConfig: SearchConfigType;
  searchable: boolean;
  searchableByText: boolean;
  sortable: boolean;
  text: string;
  type: (typeof COLUMN_TYPE_NEW_TO_LEGACY_MAPPING)[keyof typeof COLUMN_TYPE_NEW_TO_LEGACY_MAPPING];
  visible: boolean;
  width: string;
  customPredicate?: PredicateType;
};

export type SortByType = {
  ascending: boolean;
  attribute: string;
};

export type JournalConfigMetaType = Pick<
  ApiJournalConfigJsonType,
  'actions' | 'createVariants' | 'groupBy' | 'metaRecord' | 'predicate'
> & {
  title?: string;
  nodeRef?: string;
  groupActions?: string[];
  criteria?: Array<{ value: string }>;
};
export type ApiJournalConfigJsonType = {
  actions?: string[];
  actionsDef?: string[];
  actionsFromType?: string[] | null;
  columns: JournalColumnType[];
  computed?: unknown[];
  configData?: {
    attributesToLoad: Array<{ value: string }>;
    configComputed: unknown[];
    recordComputed: unknown[];
  };
  createVariants: JournalCreateVariantType[];
  defaultFilters?: unknown[];
  defaultSortBy?: SortByType[];
  editable?: boolean;
  groupBy?: string[];
  journalSettingId?: string;
  hasWritePermission: boolean;
  hideImportDataActions?: boolean;
  id: string;
  meta?: JournalConfigMetaType;
  metaRecord?: string;
  modelVersion?: number;
  name?: MLTextType;
  params?: {
    defaultSortBy: string;
  };
  predicate?: PredicateType;
  properties?: NonNullable<unknown>;
  queryData?: NonNullable<unknown>;
  searchConfig?: SearchConfigType;
  sortBy?: SortByType;
  sourceId?: string;
  system?: boolean;
  typeRef?: string;
  workspace?: string;
  listViewInfo?: Record<string, string | boolean>;
};
