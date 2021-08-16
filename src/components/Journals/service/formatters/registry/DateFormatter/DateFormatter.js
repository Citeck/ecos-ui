import moment from 'moment';

import BaseFormatter from '../BaseFormatter';

const FORMAT = 'DD.MM.YYYY';

export default class DateFormatter extends BaseFormatter {
  static TYPE = 'date';

  format(props) {
    const { cell, config = {} } = props;
    const format = config.format || FORMAT;

    return cell ? moment(cell).format(format) : '';
  }
}
