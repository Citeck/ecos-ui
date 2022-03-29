import moment from 'moment';
import get from 'lodash/get';

import { createProfileUrl } from '../helpers/urls';
import UserService from '../services/UserService';

export const getBirthdayDateForWeb = (source = {}) => {
  const target = {};
  let dateFormat = 'DD MMMM';

  if (!source || (source && !Object.keys(source))) {
    return target;
  }

  target.date = moment(get(source, 'birthDate', '')).format(dateFormat);
  target.name = get(source, 'displayName', '');
  target.nodeRef = get(source, 'userId', '');
  target.id = get(source, 'id', '');
  target.avatar = UserService.getAvatarUrl(get(source, 'avatarUrl'), { width: 150, height: 150 });
  target.url = createProfileUrl(get(source, 'userName', ''));

  return target;
};
