import moment from 'moment';
import 'moment-business-days';
import get from 'lodash/get';
import { pagesWithOnlyContent } from '../../constants';

export function getDaysOfMonth(currentDate) {
  const arr = Array.from({ length: moment(currentDate).daysInMonth() }, (x, i) => {
    return moment(currentDate)
      .startOf('month')
      .add(i, 'days');
  });

  return arr.map(day => ({
    number: day.format('D'),
    title: day.format('dd, D'),
    // рабочий день
    isBusinessDay: moment(day).isBusinessDay(),
    // короткий день
    // isShortenedDay: true,
    // текущий день
    isCurrentDay: moment().isSame(moment(day), 'd')
  }));
}

export function isOnlyContent(props) {
  const url = get(props, ['history', 'location', 'pathname'], '/');

  return pagesWithOnlyContent.includes(url);
}
