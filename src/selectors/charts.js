import get from 'lodash/get';

import { initialState } from '../reducers/charts';

const prefix = 'charts';

export const selectChartData = (state, key) => get(state, [prefix, key]) || { ...initialState };
