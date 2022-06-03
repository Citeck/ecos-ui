import BaseFormatter from '../BaseFormatter';

function format(val) {
  if (val.length <= 3) {
    return val;
  }

  const z = val.length - 3;

  return format(val.substr(0, z)) + ' ' + val.substr(z);
}

export default class NumberFormatter extends BaseFormatter {
  static TYPE = 'number';

  format(props) {
    const { cell } = props;

    if (Number.isNaN(+cell)) {
      return cell;
    }

    const [integral, fraction] = String(cell).split('.');
    const value = format(integral);

    if (!Number.isNaN(+fraction)) {
      return `${value},${fraction}`;
    }

    return value;
  }
}
