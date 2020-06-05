export default class DashletActionService {
  static Actions = {
    EDIT: 'edit',
    HELP: 'help',
    RELOAD: 'reload',
    SETTINGS: 'settings',
    BUILDER: 'builder'
  };

  static checkEditableFor = [DashletActionService.Actions.SETTINGS, DashletActionService.Actions.BUILDER];

  static baseOrder = [
    DashletActionService.Actions.EDIT,
    DashletActionService.Actions.HELP,
    DashletActionService.Actions.RELOAD,
    DashletActionService.Actions.SETTINGS
  ];
}
