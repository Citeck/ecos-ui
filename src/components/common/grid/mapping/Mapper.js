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

export function matchCardDetailsLinkFormatterColumn(column) {
  return column.attribute === 'cm:name' || column.attribute === 'cm:title';
}

const MAP = [
  {
    options: column => {
      let formatter = column.params.formatter;

      switch (formatter) {
        case 'workflowPriority':
          formatter = 'WorkflowPriorityFormatter';
          break;
        case 'taskTitle':
          formatter = 'TaskTitleFormatter';
          break;
        case 'documentLink':
          formatter = 'DocumentLinkFormatter';
          break;
        case 'dateOrDateTime':
          formatter = 'DateOrDateTimeFormatter';
          break;
        case 'datetime':
          formatter = 'DateTimeFormatter';
          break;
        case 'percent':
          formatter = 'PercentFormatter';
          break;
        default:
          // console.log('**************************************');
          // console.log('No such formatter: ', formatter);
          // console.log('**************************************');
          break;
      }

      return { name: formatter, params: column.params };
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
];

export default class Mapper {
  static getFormatterOptions(column, idx) {
    const match = MAP.filter(map => map.enable(column, idx))[0] || {};
    return match.options && match.options(column, idx);
  }
}
