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
      authorityName: 'authorityName!"CURRENT"',
      modified: '_modified?str',
      thumbnail: 'avatar.url'
    };
  }

  getUserPhoto = (recordRef = SourcesId.CURRENT_USER) => {
    return Records.get(recordRef).load(this.attributes.thumbnail, true);
  };

  getUserData = () => {
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

  getUserDataByRef = (ref, force) =>
    Records.get(ref)
      .load({ ...this.attributes }, force)
      .then(result => ({
        ...result,
        recordRef: `${SourcesId.PERSON}@${result.authorityName}`
      }));

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
          message = t('password-editor.error.invalid-password');
        } else {
          message = t('password-editor.error.server-error');
        }

        return { success: false, message };
      });
  }

  changePhoto({ record, data }) {
    const user = Records.get(record);

    if (record.includes(`${SourcesId.PEOPLE}@`)) {
      user.att('ecos:photo?str', { ...data });
    } else {
      user.att('photo', [{ ...data }]);
    }

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
