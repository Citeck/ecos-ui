import { createAction } from 'redux-actions';

const prefix = 'orgstructure/';

export const setSelectedPerson = createAction(prefix + 'SET_SELECTED_PERSON');
export const setOrgstructureConfig = createAction(prefix + 'SET_CONFIG');
