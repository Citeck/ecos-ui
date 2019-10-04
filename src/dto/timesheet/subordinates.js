import get from 'lodash/get';
import { deepClone } from '../../helpers/util';

export default class SubordinatesTimesheetConverter {
  static getSubordinatesEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = deepClone(item);
      const user = [get(item, 'user.firstName', ''), get(item, 'user.lastName', '')].join(' ');

      newItem.user = user;
      target.push(newItem);
    });

    return target;
  }
}
