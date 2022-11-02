import Records from '../../components/Records/Records';
import * as authorityApi from './authorityApi';
import isString from 'lodash/isString';
import { SourcesId } from '../../constants';

const GROUP_PREFIX = 'GROUP_';

const PERSON_SOURCE_ID = SourcesId.PERSON;
const GROUPS_SOURCE_ID = SourcesId.GROUP;

const ALFRESCO_PREFIX = 'alfresco/@';
const ALFRESCO_WORKSPACE_SPACES_STORE = 'workspace://SpacesStore/';

class AuthorityService {
  async getAuthorityName(authority) {
    if (!authority) {
      return '';
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityName(a)));
    }
    if (!isString(authority)) {
      return '';
    }
    if (!authority || authority.indexOf(GROUP_PREFIX) === 0) {
      return authority;
    }
    let localIdDelim = authority.indexOf('@');
    if (localIdDelim === -1 && authority.indexOf(ALFRESCO_WORKSPACE_SPACES_STORE) === -1) {
      return authority;
    }
    let ref = (await this.getAuthorityRef(authority)) || '';
    localIdDelim = ref.indexOf('@');
    if (localIdDelim > 0) {
      if (ref.indexOf(PERSON_SOURCE_ID) === 0) {
        return ref.substring(localIdDelim + 1);
      } else if (ref.indexOf(GROUPS_SOURCE_ID) === 0) {
        return GROUP_PREFIX + ref.substring(localIdDelim + 1);
      }
    }
    return authority;
  }

  async getAuthorityRef(authority) {
    if (!authority) {
      return '';
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityRef(a)));
    }
    if (!isString(authority)) {
      return '';
    }
    if (authority.indexOf(GROUP_PREFIX) === 0) {
      return GROUPS_SOURCE_ID + '@' + authority.substring(GROUP_PREFIX.length);
    }
    if (authority.indexOf(ALFRESCO_WORKSPACE_SPACES_STORE) !== -1) {
      if (authority.indexOf(ALFRESCO_PREFIX) === -1) {
        authority = ALFRESCO_PREFIX + authority;
      }
      const authName = await authorityApi.getAuthorityNameFromAlfresco(authority);
      if (authName.indexOf(GROUP_PREFIX) !== -1) {
        return GROUPS_SOURCE_ID + '@' + authName.substring(GROUP_PREFIX.length);
      } else {
        return PERSON_SOURCE_ID + '@' + authName;
      }
    }
    if (authority.indexOf('people@') === 0 || authority.indexOf('alfresco/people@') === 0) {
      return PERSON_SOURCE_ID + authority.substring(authority.indexOf('@'));
    }
    if (authority.indexOf('/') === -1) {
      return PERSON_SOURCE_ID + '@' + authority;
    }
    return authority;
  }

  isAuthorityGroup(authority) {
    if (!authority || !isString(authority)) {
      return false;
    }
    return authority.startsWith(GROUPS_SOURCE_ID) || authority.startsWith(GROUP_PREFIX);
  }

  async getAuthorityAttributes(authority, attributes) {
    if (!authority) {
      return null;
    }
    if (Array.isArray(authority) && authority.length === 0) {
      return [];
    }
    return Records.get(await this.getAuthorityRef(authority)).load(attributes);
  }
}

window.Citeck.AuthorityService = new AuthorityService();
export default window.Citeck.AuthorityService;
