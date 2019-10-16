import { get } from 'lodash';

export const selectDataRecordActionsByStateId = (state, dId) => get(state, ['recordActions', dId]);
