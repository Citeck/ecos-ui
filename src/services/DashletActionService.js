import { AppEditions } from '../constants';

export default class DashletActionService {
  static Actions = {
    EDIT: 'edit',
    HELP: 'help',
    RELOAD: 'reload',
    SETTINGS: 'settings',
    BUILDER: 'builder'
  };

  static uneditable = [DashletActionService.Actions.SETTINGS, DashletActionService.Actions.BUILDER];

  static enterprise = [DashletActionService.Actions.BUILDER];

  static baseOrder = [
    DashletActionService.Actions.EDIT,
    DashletActionService.Actions.HELP,
    DashletActionService.Actions.RELOAD,
    DashletActionService.Actions.SETTINGS
  ];

  static checkForEdition(edition, key) {
    if (edition !== AppEditions.ENTERPRISE) {
      return !DashletActionService.enterprise.includes(key);
    }

    return true;
  }

  static isAvailable(key, { dashboardEditable, appEdition }) {
    const available = DashletActionService.checkForEdition(appEdition, key);
    const editable = dashboardEditable || !DashletActionService.uneditable.includes(key);

    return available && editable;
  }
}
