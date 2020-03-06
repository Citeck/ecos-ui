import { CommonApi } from './common';
import { PROXY_URI, URL_CONTEXT } from '../constants/alfresco';
import { SourcesId } from '../constants';
import Records from '../components/Records';

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

  getUserData = record => {
    const query = record ? { record } : {};

    return Records.query(
      {
        query,
        sourceId: SourcesId.PEOPLE
      },
      {
        userName: 'userName',
        isAvailable: 'isAvailable?bool',
        isMutable: 'isMutable?bool',
        firstName: 'cm:firstName',
        lastName: 'cm:lastName',
        middleName: 'cm:middleName',
        isAdmin: 'isAdmin?bool',
        fullName: 'fullName',
        uid: 'cm:name',
        isBpmAdmin: '.att(n:"authorities"){has(n:"GROUP_BPM_APP_ADMIN")}'
      }
    ).then(resp => {
      if (resp.records.length < 1) {
        return {
          success: false
        };
      }

      return {
        success: true,
        payload: {
          ...resp.records[0]
        }
      };
    });
  };
}
