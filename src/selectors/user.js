import { getFullNameStr } from '../helpers/util';

export const selectUserUid = state => state.user.uid;
export const selectUserFullName = state => getFullNameStr(state.user);
