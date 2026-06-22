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

    // showSeconds is true by default
    const showSeconds = isBoolean(config.showSeconds) ? config.showSeconds : config.showSeconds !== 'false';

    // maxAsHours is false by default
    const maxAsHours = isBoolean(config.maxAsHours) ? config.maxAsHours : config.maxAsHours === 'true';

    // hoursPerDay: when set (> 0), days are calculated as totalHours / hoursPerDay (person-days mode)
    const hoursPerDayRaw = Number(config.hoursPerDay);
    const hoursPerDay = !isNaN(hoursPerDayRaw) && hoursPerDayRaw > 0 ? hoursPerDayRaw : 0;

    const isNegative = cell < 0;
    const numberModulo = Math.abs(cell);
    const duration = moment.duration(numberModulo);

    const totalHours = Math.floor(duration.asHours());
    const usePersonDays = !maxAsHours && hoursPerDay > 0;

    const days = usePersonDays ? Math.floor(totalHours / hoursPerDay) : Math.floor(duration.asDays());
    let hours;
    if (maxAsHours) {
      hours = totalHours;
    } else if (usePersonDays) {
      hours = totalHours % hoursPerDay;
    } else {
      hours = duration.hours();
    }
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const formattedParts = [];

    if (!maxAsHours && days > 0) {
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
