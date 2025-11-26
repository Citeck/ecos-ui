import { MLTextType } from '@/types/components';

export type StateWidgetHtml = {
  [stateId: string]: ObjectStateWidgetHtml;
};

export type ObjectStateWidgetHtml = {
  isVisibleEditor: boolean;
  loading: boolean;
  html: MLHtmlStringType | null;
};

export type MLHtmlStringType = MLTextType;
