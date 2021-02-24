import BaseEditor from '../BaseEditor';
import TextEditorView from './TextEditorView';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';

  get viewComponent() {
    return TextEditorView;
  }
}
