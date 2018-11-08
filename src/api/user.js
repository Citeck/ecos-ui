import { CommonApi } from './common';

export class UserApi extends CommonApi {
  getPhotoSize = userNodeRef => {
    const url = 'citeck/node?nodeRef=' + userNodeRef + '&props=ecos:photo';
    return this.getJson(url)
      .then(data => data.props['ecos:photo'].size)
      .catch(() => 0);
  };
}
