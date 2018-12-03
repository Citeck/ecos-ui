import { CommonApi } from './common';
import { PROXY_URI, URL_CONTEXT, URL_PAGECONTEXT } from '../constants/alfresco';

export class UserApi extends CommonApi {
  getPhotoSize = userNodeRef => {
    const url = `${PROXY_URI}citeck/node?nodeRef=${userNodeRef}&props=ecos:photo`;
    return this.getJson(url).then(data => {
      if (!data.props || !data.props['ecos:photo']) {
        return 0;
      }

      return data.props['ecos:photo'].size;
    });
  };

  checkIsAuthenticated = () => {
    const url = `${URL_CONTEXT}service/modules/authenticated?noCache=${new Date().getTime()}&a=user`;
    return this.getJson(url).catch(() => ({ success: false }));
  };

  doLogin = data => {
    const url = `${URL_PAGECONTEXT}dologin`;
    return this.postForm(url, data); // .catch();
  };
}
