import { RecordService } from './recordService';
import { PROXY_URI, URL_CONTEXT } from '../constants/alfresco';
import { SourcesId } from '../constants';

export class UserApi extends RecordService {
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

  getUserData = () => {
    //todo: replace to using Records.js
    return this.query({
      query: {
        sourceId: SourcesId.PEOPLE
      },
      attributes: {
        userName: 'userName',
        isAvailable: 'isAvailable',
        isMutable: 'isMutable',
        firstName: 'cm:firstName',
        lastName: 'cm:lastName',
        middleName: 'cm:middleName',
        isAdmin: 'isAdmin',
        fullName: 'fullName',
        uid: 'cm:name',
        isBpmAdmin: '.att(n:"authorities"){has(n:"GROUP_BPM_APP_ADMIN")}'
      }
    }).then(resp => {
      if (resp.records.length < 1) {
        return {
          success: false
        };
      }

      return {
        success: true,
        payload: {
          ...resp.records[0].attributes
        }
      };
    });
  };
}
