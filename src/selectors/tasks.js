export const selectDataTasksByStateId = (state, dId) => state.tasks[dId];
export const selectDataCurrentTasksByStateId = (state, dId) => state.currentTasks[dId];
