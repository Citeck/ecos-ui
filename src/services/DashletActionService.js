import { AppEditions } from '../constants';

export default class DashletActionService {
  static Actions = {
    SUBMIT: 'submit',
    EDIT: 'edit',
    HELP: 'help',
    RELOAD: 'reload',
    SETTINGS: 'settings',
    BUILDER: 'builder',
    CANCEL: 'cancel'
  };

  static uneditable = [DashletActionService.Actions.SETTINGS, DashletActionService.Actions.BUILDER];
  static enterprise = [DashletActionService.Actions.BUILDER];
  static administrative = [DashletActionService.Actions.BUILDER];

  static baseOrder = [
    DashletActionService.Actions.EDIT,
    DashletActionService.Actions.HELP,
    DashletActionService.Actions.RELOAD,
    DashletActionService.Actions.SETTINGS
  ];

  static checkForEdition(edition = AppEditions.COMMUNITY, key) {
    if (edition !== AppEditions.ENTERPRISE) {
      return !DashletActionService.enterprise.includes(key);
    }

    return true;
  }

  static isAvailable(key, { widgetEditable, appEdition, isAdmin }) {
    const available = DashletActionService.checkForEdition(appEdition, key);

    const editable = widgetEditable || !DashletActionService.uneditable.includes(key);
    const administrative = isAdmin || !DashletActionService.administrative.includes(key);

    return available && editable && administrative;
  }
}
