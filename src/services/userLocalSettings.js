import { getData } from '../helpers/ls';
import { get } from 'lodash';

export default class UserLocalSettingsService {
  static getDashletHeight(dashletId) {
    return get(getData(dashletId), 'height');
  }
}
