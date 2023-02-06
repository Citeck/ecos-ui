import moment from 'moment';
import get from 'lodash/get';

import { createProfileUrl } from '../helpers/urls';
import UserService from '../services/UserService';

export const compareDayAndMonth = (r1, r2) => {
  const d1 = moment(r1);
  const d2 = moment(r2);

  return Math.sign(d1.month() - d2.month() || d1.date() - d2.date());
};

export const sortByBirthDate = (records = []) =>
  [...records].sort((r1, r2) => compareDayAndMonth(get(r1, 'birthDay', ''), get(r2, 'birthDay', '')));

export const getBirthdayDateForWeb = (source = {}) => {
  const target = {};
  let dateFormat = 'DD MMMM';

  if (!source || (source && !Object.keys(source))) {
    return target;
  }

  target.date = moment(get(source, 'birthDay', '')).format(dateFormat);
  target.name = get(source, 'displayName', '');
  target.id = get(source, 'id', '');
  target.avatar = UserService.getAvatarUrl(get(source, 'avatarUrl'), { width: 150, height: 150 });
  target.url = createProfileUrl(get(source, 'userName', ''));

  return target;
};
