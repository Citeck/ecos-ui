import BaseEditor from '../BaseEditor';
import TextEditorControl from './TextEditorControl';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';

  getEditorControl() {
    return TextEditorControl;
  }
}
