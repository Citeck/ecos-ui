import { CommonApi } from './common';
import { SourcesId, URL } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records/Records';
import { ALL_USERS_GROUP_SHORT_NAME } from '../components/common/form/SelectOrgstruct/constants';
import ecosXhr from '../helpers/ecosXhr';

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

  getLoginPageUrl = () => {
    return Records.get('uiserv/config@login-page-redirect-url')
      .load('value?str', true)
      .then(url => {
        if (url === null || url === '') {
          return false;
        }

        return url;
      })
      .catch(e => {
        console.error(e);

        return false;
      });
  };

  setRecordUrl = (recordRef, url, valueField = 'value') => {
    const record = Records.get(recordRef);

    record.att(valueField, url);

    return record.save();
  };
}
