import './style.scss';

export const defaultTheme = {
  list: {
    listitem: 'rt-editor-theme__list-item',
    listitemChecked: 'rt-editor-theme__list-item-checked',
    listitemUnchecked: 'rt-editor-theme__list-item-unchecked',
    nested: {
      listitem: 'rt-editor-theme__nested-list-item'
    },
    olDepth: ['rt-editor-theme__ol1', 'rt-editor-theme__ol2', 'rt-editor-theme__ol3', 'rt-editor-theme__ol4', 'rt-editor-theme__ol5'],
    ul: 'rt-editor-theme__ul'
  },
  text: {
    bold: 'rt-editor-theme__text_bold',
    italic: 'rt-editor-theme__text_italic',
    strikethrough: 'rt-editor-theme__text_strike-through',
    underline: 'rt-editor-theme__text_underline',
    underlineStrikethrough: 'rt-editor-theme__text_underline-strike-through',
    subscript: 'rt-editor-theme__text_subscript',
    superscript: 'rt-editor-theme__text_superscript',
    code: 'rt-editor-theme__tex_code'
  }
};
