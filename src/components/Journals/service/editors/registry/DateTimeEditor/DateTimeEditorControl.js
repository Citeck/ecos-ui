import DateEditorControl from '../DateEditor/DateEditorControl';

const EDITOR_FORMAT = 'dd.MM.YYYY HH:mm';

export default class DateTimeEditorControl extends DateEditorControl {
  get dateFormat() {
    return EDITOR_FORMAT;
  }

  get extraProps() {
    return {
      showTimeSelect: true
    };
  }
}
