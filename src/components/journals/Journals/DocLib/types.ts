import { NODE_TYPES } from '@citeck/constants/docLib';

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

export interface FileItemAction {
  id?: string;
  name?: string;
  pluralName?: string;
  icon?: string;
  type?: string;
  theme?: string;
  order?: string;
  hidden?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export interface FileItem {
  id: string;
  title: string;
  type: NodeType;
  modified?: string;
  typeRef?: string;
  actions?: FileItemAction[];
}

export interface SidebarItem {
  id: string;
  title: string;
  parent?: string | null;
  hasChildren?: boolean;
  isUnfolded?: boolean;
  isChildrenLoading?: boolean;
  isChildrenLoaded?: boolean;
}

export interface CreateVariant {
  id: string;
  key: string;
  name: string;
  typeRef: string;
  formRef?: string;
  attributes?: Record<string, string>;
  postActionRef?: string;
  nodeType: NodeType;
}

export interface PathItem {
  id: string;
  disp: string;
}

export interface DocLibPagination {
  skipCount: number;
  maxItems: number;
  page: number;
}

export interface FileViewerState {
  isReady: boolean;
  items: FileItem[];
  selected: string[];
  lastClicked: string | null;
  total: number;
  pagination: DocLibPagination;
  hasError: boolean;
}

export interface SidebarState {
  isReady: boolean;
  items: SidebarItem[];
  hasError: boolean;
}

export interface GroupActionsState {
  isReady: boolean;
  forRecords: { actions?: FileItemAction[] };
  forQuery?: { actions?: FileItemAction[] };
}
