import TextEditor from '../TextEditor';

export default class NumberEditor extends TextEditor {
  static TYPE = 'number';
  inputType = NumberEditor.TYPE;
}
