import get from 'lodash/get';

import { defaultState } from '@/reducers/customWidgetHtml';
import { RootState } from '@/types/store';

const selectState = (state: RootState, key: string) => get(state, ['customWidgetHtml', key], { ...defaultState }) || {};

export const selectCustomWidgetData = selectState;
