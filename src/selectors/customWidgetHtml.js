import get from 'lodash/get';

import { defaultState } from '../reducers/customWidgetHtml';

const selectState = (state, key) => get(state, ['customWidgetHtml', key], { ...defaultState }) || {};

export const selectCustomWidgetData = selectState;
