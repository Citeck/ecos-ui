import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';

import { getTextByLocale, t } from '../../../helpers/util';
import EditorService from '../service/editors/EditorService';
import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from './util';
import {
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF,
  COLUMN_DATA_TYPE_TEXT
} from '../../Records/predicates/predicates';
import EditorScope from './editors/EditorScope';

const NOT_SORTABLE_TYPES = [
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF
];

const GROUPABLE_TYPES = [
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_NODEREF,
  COLUMN_DATA_TYPE_TEXT
];

const ASSOC_TYPES = ['ASSOC', 'PERSON', 'AUTHORITY_GROUP', 'AUTHORITY', 'CONTENT'];

for (let type of ASSOC_TYPES) {
  const mapValue = COLUMN_TYPE_NEW_TO_LEGACY_MAPPING[type];
  if (mapValue) {
    ASSOC_TYPES.push(mapValue);
  }
}

const getBoolOrElse = (value, orElse) => {
  if (value == null) {
    if (isFunction(orElse)) {
      return orElse();
    } else {
      return orElse;
    }
  }
  return value;
};

class JournalColumnsResolver {
  async resolve(columns) {
    if (!columns) {
      columns = [];
    }
    return columns.map((c, i) => this._resolveColumn(c, i));
  }

  _resolveColumn(column) {
    const type = column.type || 'text';
    const name = column.name || column.attribute;
    const label = this._getLabel(column);
    const multiple = column.multiple === true;

    const attribute = column.schema || column.attribute || column.name;
    const attSchema = `${attribute}${multiple ? '[]' : ''}${this._getInnerSchema(type, column.attSchema)}`;

    const editable = attribute === column.name && getBoolOrElse(column.editable, true);
    const searchable = getBoolOrElse(column.searchable, () => attribute === name);
    const sortable = getBoolOrElse(column.sortable, () => NOT_SORTABLE_TYPES.indexOf(type) === -1);
    const groupable = getBoolOrElse(column.groupable, () => GROUPABLE_TYPES.indexOf(type) === -1);
    const hidden = getBoolOrElse(column.hidden, false);
    const visible = getBoolOrElse(column.visible, () => getBoolOrElse(column.default, true));
    const defaultValue = getBoolOrElse(column['default'], true);

    const params = column.params || {};

    const updColumn = {
      ...column,
      name,
      type,
      label,
      params,
      hidden,
      visible,
      editable,
      sortable,
      multiple,
      groupable,
      searchable,
      attribute,
      attSchema,
      text: label,
      dataField: name,
      default: defaultValue
    };

    updColumn.formatExtraData = { createVariants: updColumn.createVariants };
    updColumn.filterValue = cell => {
      let res = cell || '';
      if (res.disp) {
        res = res.disp;
      }
      return res;
    };

    if (!updColumn.newFormatter || !updColumn.newFormatter.type) {
      updColumn.newFormatter = {
        type: 'default'
      };
    }

    if (updColumn.newEditor) {
      updColumn.editorRenderer = this._initEditorRenderer(updColumn.newEditor);
    }

    return updColumn;
  }

  _initEditorRenderer = newEditor => {
    return (editorProps, value) => {
      return EditorService.getEditorControl({
        value,
        type: newEditor.type,
        config: newEditor.config,
        scope: EditorScope.CELL
      });
    };
  };

  _getInnerSchema(columnType, attSchema) {
    if (attSchema) {
      return attSchema;
    }
    if (ASSOC_TYPES.indexOf(columnType) !== -1) {
      return '{disp:?disp,value:?assoc}';
    }
    if (columnType === 'NUMBER' || columnType === 'double') {
      return '?num';
    }
    if (columnType === 'BOOLEAN' || columnType === 'boolean') {
      return '?bool';
    }
    return '?disp';
  }

  _getLabel(column) {
    let label;
    if (column.label) {
      label = isObject(column.label) ? getTextByLocale(column.label) : column.label;
    }
    label = label || column.text || column.name;
    return label ? t(label) : t('journal.cell.no-label');
  }
}

const INSTANCE = new JournalColumnsResolver();
export default INSTANCE;
