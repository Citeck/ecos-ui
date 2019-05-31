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
person
authorityGroup
authority
*/

const MAP = [
  {
    options: () => 'DateTimeFormatter',
    enable: column => column.type === 'datetime' || column.type === 'date'
  },
  {
    options: () => 'BooleanFormatter',
    enable: column => column.type === 'boolean'
  },
  {
    options: () => 'CardDetailsLinkFormatter',
    enable: column => column.attribute === 'cm:name' || column.attribute === 'cm:title'
  },
  {
    options: () => 'SelectFormatter',
    enable: column => column.attribute === 'payments:paymentFor'
  },
  {
    options: () => 'AssocFormatter',
    enable: column => column.type === 'assoc'
  },
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
          console.log('**************************************');
          console.log('No such formatter: ', formatter);
          console.log('**************************************');
          break;
      }

      return { name: formatter, params: column.params };
    },
    enable: column => column.params && column.params.formatter
  }
];

export default class Mapper {
  static getFormatterOptions(column, idx) {
    const match = MAP.filter(map => map.enable(column, idx))[0] || {};
    return match.options && match.options(column, idx);
  }
}
