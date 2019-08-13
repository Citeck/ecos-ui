import { get } from 'lodash';

export const selectStateDocStatusById = (state, dId) => get(state, ['docStatus', dId], {});
