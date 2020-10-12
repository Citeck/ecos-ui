import { CommonApi } from './common';
import { PROXY_URI, URL_CONTEXT } from '../constants/alfresco';
import { SourcesId } from '../constants';
import Records from '../components/Records';
import { t } from '../helpers/util';
import { isNewJournalsPageEnable } from './export/journalsApi';

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

  getUserData = () => {
    return Records.query(
      {
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
        isBpmAdmin: '.att(n:"authorities"){has(n:"GROUP_BPM_APP_ADMIN")}',
        nodeRef: 'nodeRef?str'
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

  getUserDataByRef(ref) {
    return Records.get(ref)
      .load({
        userName: 'userName',
        firstName: 'cm:firstName',
        lastName: 'cm:lastName',
        middleName: 'cm:middleName',
        isAdmin: 'isAdmin?bool',
        nodeRef: 'nodeRef?str'
      })
      .then(responce => responce);
  }

  changePassword({ record, data: { oldPass, pass, passVerify } }) {
    const user = Records.get(record);

    user.att('ecos:pass', pass);
    user.att('ecos:passVerify', passVerify);
    user.att('ecos:oldPass', oldPass);

    return user
      .save()
      .then(response => ({ response, success: true }))
      .catch(response => {
        let message = response.message || (response.errors && response.errors.join('; ')) || '';

        if (message.indexOf('BadCredentials') !== -1) {
          message = t('user-profile-widget.error.invalid-password');
        } else {
          message = t('user-profile-widget.error.server-error');
        }

        return { success: false, message };
      });
  }

  changePhoto({ record, data }) {
    const user = Records.get(record);

    user.att('ecos:photo?str', { ...data });

    return user
      .save()
      .then(response => ({ response, success: true }))
      .catch(response => {
        const message = response.message || (response.errors && response.errors.join('; ')) || '';

        return { success: false, message };
      });
  }

  checkNewUIAvailableStatus() {
    return isNewJournalsPageEnable();
  }
}
