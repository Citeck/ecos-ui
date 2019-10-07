import get from 'lodash/get';
import { deepClone } from '../../helpers/util';

export default class SubordinatesTimesheetConverter {
  static getSubordinatesEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = deepClone(item);

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');

      newItem.timesheetNumber = get(item, 'user.userName', '');
      newItem.status = get(item, 'status.status', '');

      target.push(newItem);
    });

    return target;
  }
}
