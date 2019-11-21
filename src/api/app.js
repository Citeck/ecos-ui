import { CommonApi } from './common';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records/Records';
import { ALL_USERS_GROUP_SHORT_NAME } from '../components/common/form/SelectOrgstruct/constants';

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
    return Records.get('uiserv/config@orgstruct-allUsers-group-shortName')
      .load('value')
      .then(resp => resp || ALL_USERS_GROUP_SHORT_NAME)
      .catch(() => ALL_USERS_GROUP_SHORT_NAME);
  };
}
