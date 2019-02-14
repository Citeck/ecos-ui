const MAP = [
  {
    options: 'DateTimeFormatter',
    enable: column => column.javaClass === 'java.util.Date'
  },
  {
    options: 'CardDetailsLinkFormatter',
    enable: column => column.attribute === 'cm:name' || column.attribute === 'cm:title'
  }
];

export default class Mapper {
  static getFormatterOptions(column, idx) {
    const match = MAP.filter(map => map.enable(column, idx))[0] || {};
    return match.options;
  }
}
