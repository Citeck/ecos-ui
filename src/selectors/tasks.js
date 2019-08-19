import { get } from 'lodash';

export const selectStateTasksById = (state, dId) => get(state, ['tasks', dId], {});
export const selectStateCurrentTasksById = (state, dId) => get(state, ['currentTasks', dId], {});
