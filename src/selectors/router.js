import { createSelector } from 'reselect';
import get from 'lodash/get';

import { getSearchParams } from '../helpers/urls';

const selectState = state => get(state, 'router', {});

export const selectSearch = createSelector(
  selectState,
  router => {
    const search = get(router, 'location.search', '');

    return getSearchParams(search) || {};
  }
);
