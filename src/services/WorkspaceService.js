import { EventEmitter2 } from 'eventemitter2';

class WorkspaceService {
  static emitter = new EventEmitter2();

  static Events = {
    UPDATE_LIST: 'ecos-workspace-update-list'
  };
}

window.Citeck = window.Citeck || {};
window.Citeck.WorkspaceService = WorkspaceService;

export default window.Citeck.WorkspaceService;
