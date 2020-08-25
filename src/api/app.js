import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';

import ecosXhr from '../helpers/ecosXhr';
import { loadScript } from '../helpers/util';
import { SourcesId } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records/Records';
import { ALL_USERS_GROUP_SHORT_NAME } from '../components/common/form/SelectOrgstruct/constants';
import { CommonApi } from './common';

export class AppApi extends CommonApi {
  getEcosConfig = configName => {
    const url = `${PROXY_URI}citeck/ecosConfig/ecos-config-value?configName=${configName}`;
    return this.getJson(url)
      .then(resp => resp.value)
      .catch(() => '');
  };

  touch = () => {
    const url = `${PROXY_URI}citeck/ecos/touch`;
    return this.getJson(url);
  };

  getOrgstructAllUsersGroupName = () => {
    return Records.get(`${SourcesId.CONFIG}@orgstruct-allUsers-group-shortName`)
      .load('value')
      .then(resp => resp || ALL_USERS_GROUP_SHORT_NAME)
      .catch(() => ALL_USERS_GROUP_SHORT_NAME);
  };

  uploadFile = (data, callback) => {
    return ecosXhr(`${PROXY_URI}eform/file`, {
      method: 'POST',
      body: data,
      handleProgress: callback
    }).then(
      response => response,
      error => {
        throw error;
      }
    );
  };

  isDashboardEditable = ({ username }) => {
    return Promise.all([
      Records.get(`${SourcesId.CONFIG}@restrict-access-to-edit-dashboard`)
        .load('value?bool')
        .catch(() => false),
      Records.get(`${SourcesId.PEOPLE}@${username}`)
        .load('isAdmin?bool')
        .catch(() => false)
    ]).then(([isRestrictionOn, isAdmin]) => !isRestrictionOn || isAdmin);
  };

  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    })
      .then(result => result)
      .catch(err => {
        console.error(err);
        return {};
      });
  };

  getFooter = () => {
    return Records.get('uiserv/config@footer-content')
      .load('value?str')
      .catch(() => null);
  };

  static getDictionaryLocal(lang) {
    return import(`../i18n/${lang}`)
      .then(module => module.default)
      .catch(e => {
        console.error(e);
        return {};
      });
  }

  static getDictionaryServer(lang) {
    return new Promise(resolve => {
      if (!lodashGet(window, 'Alfresco.messages')) {
        lodashSet(window, 'Alfresco.messages', { global: null, scope: {} });
      }

      loadScript(`/share/service/messages.js?locale=${lang}`, () => {
        resolve();
      });
    })
      .then(_ => {
        return lodashGet(window, 'Alfresco.messages.global', {});
      })
      .catch(e => {
        console.error(e);
        return {};
      });
  }
}
