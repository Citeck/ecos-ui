import { DEFAULT_EDITOR_TYPE } from '@/components/journals/Journals/service/editors/constants';

class EditorRegistry {
  #registry = {};

  register(editor) {
    let type = editor.getType();
    this.#registry[type] = editor;
  }

  getEditor(id) {
    return this.#registry[id] || this.#registry[DEFAULT_EDITOR_TYPE];
  }
}

export default EditorRegistry;
