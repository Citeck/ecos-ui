import { EventEmitter } from 'events';

class WorkspaceService {
  static emitter = new EventEmitter();

  static Events = {
    UPDATE_LIST: 'ecos-workspace-update-list',
  };
}

window.Citeck = window.Citeck || {};
window.Citeck.WorkspaceService = WorkspaceService;

export default window.Citeck.WorkspaceService;
