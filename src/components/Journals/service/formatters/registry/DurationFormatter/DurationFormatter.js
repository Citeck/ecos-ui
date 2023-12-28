import moment from 'moment';
import isBoolean from 'lodash/isBoolean';

import BaseFormatter from '../../BaseFormatter';

export default class DurationFormatter extends BaseFormatter {
  static TYPE = 'duration';

  format(props) {
    return this._formatDuration(props);
  }

  _formatDuration(props) {
    const { cell, config = {} } = props;

    if (Number.isNaN(cell) || isNaN(cell) || cell === null) {
      return '';
    }

    const showSeconds = isBoolean(config.showSeconds) ? config.showSeconds : config.showSeconds !== 'false';
    const isNegative = cell < 0;
    const numberModulo = Math.abs(cell);
    const duration = moment.duration(numberModulo);

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const formattedParts = [];

    if (days > 0) {
      formattedParts.push(`${days}d`);
    }
    if (hours > 0) {
      formattedParts.push(`${hours}h`);
    }
    if (minutes > 0) {
      formattedParts.push(`${minutes}m`);
    }
    if (showSeconds && seconds > 0) {
      formattedParts.push(`${seconds}s`);
    }

    if (formattedParts.length === 0) {
      if (showSeconds) {
        formattedParts.push(`0s`);
      } else {
        formattedParts.push(`0m`);
      }
    }

    return `${isNegative ? '- ' : ''}${formattedParts.join(' ')}`;
  }
}
