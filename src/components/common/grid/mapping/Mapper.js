/*
text
mltext
content
int
long
float
double
date
datetime
boolean
qname
category
noderef
options
+assoc
*/
import get from 'lodash/get';

export function matchCardDetailsLinkFormatterColumn(column) {
  return column.attribute === 'cm:name' || column.attribute === 'cm:title';
}

const MAP = [
  {
    options: column => {
      const formatter = column.params.formatter;
      const params = { ...column.params };
      let name = '';

      console.warn({ column });

      switch ('locale' /*formatter*/) {
        case 'workflowPriority':
          name = 'WorkflowPriorityFormatter';
          break;
        case 'taskTitle':
          name = 'TaskTitleFormatter';
          break;
        case 'documentLink':
          name = 'DocumentLinkFormatter';
          break;
        case 'dateOrDateTime':
          name = 'DateOrDateTimeFormatter';
          break;
        case 'datetime':
          name = 'DateTimeFormatter';
          break;
        case 'percent':
          name = 'PercentFormatter';
          break;
        case 'сardDetailsLink':
          name = 'CardDetailsLinkFormatter';
          break;
        case 'taskLink':
          name = 'TaskLinkFormatter';
          break;
        case 'locale':
          name = 'LocaleFormatter';
          break;
        default:
          if (formatter.includes('dateFormatter')) {
            name = 'DateTimeFormatter';
            params.format = get(formatter.split("'"), '[1]', '').toUpperCase();
          }
          break;
      }

      return { name, params };
    },
    enable: column => column.params && column.params.formatter
  },
  {
    options: () => 'DateFormatter',
    enable: column => column.attribute === 'bpm:startDate'
  },
  {
    options: () => 'DateTimeFormatter',
    enable: column => column.type === 'datetime'
  },
  {
    options: () => 'DateFormatter',
    enable: column => column.type === 'date'
  },
  {
    options: () => 'BooleanFormatter',
    enable: column => column.type === 'boolean'
  },
  {
    options: column => {
      const params = column.params || {};
      return { name: 'SelectFormatter', params: { ...params, column } };
    },
    enable: column => column.type === 'options'
  },
  {
    options: () => 'AssocFormatter',
    enable: column => column.type === 'assoc'
  },
  {
    options: () => 'AssocFormatter',
    enable: column => column.type === 'person' || column.type === 'authority' || column.type === 'authorityGroup'
  },
  {
    options: () => 'NumberFormatter',
    enable: column => column.type === 'int' || column.type === 'long' || column.type === 'float' || column.type === 'double'
  },
  {
    options: () => 'CardDetailsLinkFormatter',
    enable: column => matchCardDetailsLinkFormatterColumn(column) && !column.disableFormatter
  }
  // it is not used and breaks UX (users are uncomfortable when they cannot select elements with a simple click on the element,
  // since it opens the viewing of the record they poked on). Return if necessary.
  //
  // {
  //   options: () => 'CardDetailsLinkFormatter',
  //   enable: column => column.attribute === 'cm:name' || column.attribute === 'cm:title'
  // },
];

export default class Mapper {
  static getFormatterOptions(column, idx) {
    const match = MAP.filter(map => map.enable(column, idx))[0] || {};

    return match.options && match.options(column, idx);
  }
}
