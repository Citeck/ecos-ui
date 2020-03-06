import moment from 'moment';
import get from 'lodash/get';

import { IMAGE_URL_PATH } from '../constants';
import { createProfileUrl } from '../helpers/urls';

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
  target.avatar = `${IMAGE_URL_PATH}?nodeRef=${target.nodeRef}&property=ecos:photo&width=150&height=150`;
  target.url = createProfileUrl(get(source, 'userName', ''));

  return target;
};
