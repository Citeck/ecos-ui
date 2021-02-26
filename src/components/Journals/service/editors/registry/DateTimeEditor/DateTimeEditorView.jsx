import DateEditorView from '../DateEditor/DateEditorView';

const EDITOR_FORMAT = 'dd.MM.YYYY HH:mm';

export default class DateTimeEditorView extends DateEditorView {
  get dateFormat() {
    return EDITOR_FORMAT;
  }

  get extraProps() {
    return {
      showTimeSelect: true
    };
  }
}
