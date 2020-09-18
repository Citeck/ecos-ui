import ViewAction from './ViewAction';

export default class BackgroundOpenAction extends ViewAction {
  static ACTION_ID = 'open-in-background';

  async execForRecord(record, action, context) {
    const actionWithBackground = {
      ...action,
      config: {
        ...(action.config || {}),
        background: true
      }
    };
    return super.execForRecord(record, actionWithBackground, context);
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.open-in-background',
      icon: 'icon-new-tab'
    };
  }
}
