// @ts-ignore
import { EditorThemeClasses } from 'lexical/LexicalEditor';
import './style.scss';

export const defaultTheme: EditorThemeClasses = {
  list: {
    checklist: 'PlaygroundEditorTheme__checklist',
    listitem: 'LEd__listItem',
    listitemChecked: 'LEd__listItemChecked',
    listitemUnchecked: 'LEd__listItemUnchecked',
    nested: {
      listitem: 'rt-editor-theme__nested-list-item',
      list: undefined
    },
    olDepth: ['LEd__ol1', 'LEd__ol2', 'LEd__ol3', 'LEd__ol4', 'LEd__ol5'],
    ul: 'LEd__ul',
    ulDepth: undefined,
    ol: undefined
  },
  text: {
    bold: 'rt-editor-theme__text_bold',
    italic: 'rt-editor-theme__text_italic',
    strikethrough: 'rt-editor-theme__text_strike-through',
    underline: 'rt-editor-theme__text_underline',
    underlineStrikethrough: 'rt-editor-theme__text_underline-strike-through',
    subscript: 'rt-editor-theme__text_subscript',
    superscript: 'rt-editor-theme__text_superscript',
    code: 'LEd__textCode',
    base: 'LEd__embedBlock',
    capitalize: 'LEd__textCapitalize',
    highlight: 'LEd__textHighlight',
    lowercase: 'LEd__textLowercase',
    uppercase: 'LEd__textUppercase'
  },
  table: 'rt-editor-theme__table',
  tableAddColumns: 'rt-editor-theme__tableAddColumns',
  tableAddRows: 'rt-editor-theme__tableAddRows',
  tableCell: 'rt-editor-theme__tableCell',
  tableCellActionButton: 'rt-editor-theme__tableCellActionButton',
  tableCellActionButtonContainer: 'rt-editor-theme__tableCellActionButtonContainer',
  tableCellEditing: 'rt-editor-theme__tableCellEditing',
  tableCellHeader: 'rt-editor-theme__tableCellHeader',
  tableCellPrimarySelected: 'rt-editor-theme__tableCellPrimarySelected',
  tableCellResizer: 'rt-editor-theme__tableCellResizer',
  tableCellSelected: 'rt-editor-theme__tableCellSelected',
  tableCellSortedIndicator: 'rt-editor-theme__tableCellSortedIndicator',
  tableResizeRuler: 'rt-editor-theme__tableCellResizeRuler',
  tableSelected: 'rt-editor-theme__tableSelected',
  tableSelection: 'rt-editor-theme__tableSelection',
  blockCursor: 'LEd__blockCursor',
  characterLimit: 'LEd__characterLimit',
  code: 'LEd__code',
  codeHighlight: {
    atrule: 'LEd__tokenAttr',
    attr: 'LEd__tokenAttr',
    boolean: 'LEd__tokenProperty',
    builtin: 'LEd__tokenSelector',
    cdata: 'LEd__tokenComment',
    char: 'LEd__tokenSelector',
    class: 'LEd__tokenFunction',
    'class-name': 'LEd__tokenFunction',
    comment: 'LEd__tokenComment',
    constant: 'LEd__tokenProperty',
    deleted: 'LEd__tokenProperty',
    doctype: 'LEd__tokenComment',
    entity: 'LEd__tokenOperator',
    function: 'LEd__tokenFunction',
    important: 'LEd__tokenVariable',
    inserted: 'LEd__tokenSelector',
    keyword: 'LEd__tokenAttr',
    namespace: 'LEd__tokenVariable',
    number: 'LEd__tokenProperty',
    operator: 'LEd__tokenOperator',
    prolog: 'LEd__tokenComment',
    property: 'LEd__tokenProperty',
    punctuation: 'LEd__tokenPunctuation',
    regex: 'LEd__tokenVariable',
    selector: 'LEd__tokenSelector',
    string: 'LEd__tokenSelector',
    symbol: 'LEd__tokenProperty',
    tag: 'LEd__tokenProperty',
    url: 'LEd__tokenOperator',
    variable: 'LEd__tokenVariable'
  },
  embedBlock: {
    base: 'LEd__embedBlock',
    focus: 'LEd__embedBlockFocus'
  },
  hashtag: 'LEd__hashtag',
  heading: {
    h1: 'LEd__h1',
    h2: 'LEd__h2',
    h3: 'LEd__h3',
    h4: 'PlaygroundEditorTheme__h4',
    h5: 'PlaygroundEditorTheme__h5',
    h6: 'PlaygroundEditorTheme__h6'
  },
  image: 'PlaygroundEditorTheme__image',
  indent: 'LEd__indent',
  link: 'LEd__link',
  ltr: 'LEd__ltr',
  mark: 'LEd__mark',
  markOverlap: 'LEd__markOverlap',
  paragraph: 'PlaygroundEditorTheme__paragraph',
  quote: 'LEd__quote',
  rtl: 'LEd__rtl',
  autocomplete: 'LEd__autocomplete',
  hr: 'LEd__hr',
  inlineImage: 'inline-editor-image',
  layoutContainer: 'LEd__layoutContainer',
  layoutItem: 'LEd__layoutItem',
  specialText: 'LEd__specialText',
  tab: 'LEd__tabNode',
  tableAlignment: {
    center: 'LEd__tableAlignmentCenter',
    right: 'LEd__tableAlignmentRight'
  },
  tableFrozenColumn: 'LEd__tableFrozenColumn',
  tableFrozenRow: 'LEd__tableFrozenRow',
  tableRowStriping: 'LEd__tableRowStriping',
  tableScrollableWrapper: 'LEd__tableScrollableWrapper'
};
