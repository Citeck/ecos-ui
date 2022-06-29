import Records from '../../components/Records/Records';
import * as authorityApi from './authorityApi';

const PERSON_SOURCE_ID = 'emodel/person';
const GROUPS_SOURCE_ID = 'emodel/authority-group';

const GROUP_PREFIX = 'GROUP_';
const ALFRESCO_PREFIX = 'alfresco/@';

class AuthorityService {
  async getAuthorityRef(authority) {
    if (!authority) {
      return authority;
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityRef(a)));
    }
    if (authority.indexOf(GROUP_PREFIX) === 0) {
      return GROUPS_SOURCE_ID + '@' + authority.substring(GROUP_PREFIX.length);
    }
    if (authority.indexOf('workspace://SpacesStore/') !== -1) {
      if (authority.indexOf(ALFRESCO_PREFIX) === -1) {
        authority = ALFRESCO_PREFIX + authority;
      }
      const authName = authorityApi.getAuthorityNameFromAlfresco(authority);
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

  async getAuthorityAttributes(authority, attributes) {
    console.log('getAuthorityAttributes', authority, attributes);
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
