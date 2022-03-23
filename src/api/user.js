import isEmpty from 'lodash/isEmpty';

import { PROXY_URI } from '../constants/alfresco';
import { SourcesId } from '../constants';
import Records from '../components/Records';
import { t } from '../helpers/util';
import { CommonApi } from './common';
import { isNewJournalsPageEnable } from './export/journalsApi';

export class UserApi extends CommonApi {
  get attributes() {
    return {
      userName: '_localId',
      isDeputyAvailable: 'atWorkplace?bool',
      isMutable: 'isMutable?bool',
      firstName: 'firstName',
      lastName: 'lastName',
      middleName: 'middleName',
      isAdmin: 'isAdmin?bool',
      fullName: 'fullName',
      uid: 'id',
      isDisabled: 'personDisabled?bool',
      isBpmAdmin: 'authorities._has.GROUP_BPM_APP_ADMIN?bool',
      // nodeRef: '_id',
      authorityName: 'authorityName!"CURRENT"',
      modified: '_modified?str',
      avatar: 'avatar.url'
    };
  }

  getPhotoSize = userNodeRef => {
    const url = `${PROXY_URI}citeck/node?nodeRef=${userNodeRef}&props=ecos:photo`;
    return this.getJson(url).then(data => {
      if (!data.props || !data.props['ecos:photo']) {
        return 0;
      }

      return data.props['ecos:photo'].size;
    });
  };

  getUserData = () => {
    console.warn('get user data ===> ', SourcesId.CURRENT_USER);

    return Records.get(SourcesId.CURRENT_USER)
      .load({ ...this.attributes })
      .then(result => {
        if (isEmpty(result)) {
          return {
            success: false
          };
        }

        return {
          success: true,
          payload: {
            ...result,
            isAvailable: !result.isDisabled,
            recordRef: `${SourcesId.PERSON}@${result.authorityName}`
          }
        };
      });
  };

  isUserAdmin = () => {
    return Records.get(SourcesId.CURRENT_USER).load('isAdmin?bool');
  };

  getUserDataByRef = ref =>
    Records.get(ref)
      .load({ ...this.attributes })
      .then(result => ({
        ...result,
        recordRef: `${SourcesId.PERSON}@${result.authorityName}`
      }));

  changePassword({ record, data: { oldPass, pass, passVerify } }) {
    const user = Records.get(record);

    console.warn('changePassword => ', { record });

    user.att('ecos:pass', pass);
    user.att('ecos:passVerify', passVerify);
    user.att('ecos:oldPass', oldPass);

    return user
      .save()
      .then(response => ({ response, success: true }))
      .catch(response => {
        let message = response.message || (response.errors && response.errors.join('; ')) || '';

        if (message.indexOf('BadCredentials') !== -1) {
          message = t('password-editor.error.invalid-password');
        } else {
          message = t('password-editor.error.server-error');
        }

        return { success: false, message };
      });
  }

  changePhoto({ record, data }) {
    const user = Records.get(record);

    console.warn('changePhoto => ', { record });

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
