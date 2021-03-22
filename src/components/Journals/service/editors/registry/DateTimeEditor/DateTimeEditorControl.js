import DateEditorControl from '../DateEditor/DateEditorControl';

export default class DateTimeEditorControl extends DateEditorControl {
  get dateFormat() {
    return 'dd.MM.yyyy hh:mm';
  }

  get extraProps() {
    return {
      ...super.extraProps,
      showTimeSelect: true
    };
  }
}
