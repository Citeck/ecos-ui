import DateEditorControl from '../DateEditor/DateEditorControl';

export default class DateTimeEditorControl extends DateEditorControl {
  dateFormat = 'dd.MM.yyyy HH:mm';

  get extraProps() {
    return {
      ...super.extraProps,
      showTimeInput: true
    };
  }
}
