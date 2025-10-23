import isString from 'lodash/isString';

import { SourcesId } from '../../constants';

import * as authorityApi from './authorityApi';

import Records from '@/components/Records/Records';
import { PERMISSION_WRITE_ATTR } from '@/components/Records/constants';
import { AttributesType } from '@/components/Records/types';
import { getCurrentUserName, getEnabledWorkspaces } from '@/helpers/util';

const GROUP_PREFIX = 'GROUP_';

const PERSON_SOURCE_ID = SourcesId.PERSON;
const GROUPS_SOURCE_ID = SourcesId.GROUP;

const ALFRESCO_PREFIX = 'alfresco/@';
const ALFRESCO_WORKSPACE_SPACES_STORE = 'workspace://SpacesStore/';

class AuthorityService {
  async getAuthorityName(authority: string | string[]): Promise<string | string[]> {
    if (!authority) {
      return '';
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityName(a))) as Promise<string[]>;
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
    const ref = (await this.getAuthorityRef(authority)) || '';
    if (Array.isArray(ref)) {
      return ''; // This case shouldn't happen, but we need to handle it for type safety
    }
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

  async getAuthorityRef(authority: string | string[]): Promise<string | string[]> {
    if (!authority) {
      return '';
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityRef(a))) as Promise<string[]>;
    }
    if (!isString(authority)) {
      return '';
    }
    if (isString(authority) && authority.indexOf(GROUP_PREFIX) === 0) {
      return GROUPS_SOURCE_ID + '@' + authority.substring(GROUP_PREFIX.length);
    }
    if (authority.indexOf(ALFRESCO_WORKSPACE_SPACES_STORE) !== -1) {
      if (authority.indexOf(ALFRESCO_PREFIX) === -1) {
        authority = ALFRESCO_PREFIX + authority;
      }
      const authName = await authorityApi.getAuthorityNameFromAlfresco(authority);
      if (isString(authName) && authName.indexOf(GROUP_PREFIX) !== -1) {
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

  isAuthorityGroup(authority: string): boolean {
    if (!authority || !isString(authority)) {
      return false;
    }
    return authority.startsWith(GROUPS_SOURCE_ID) || authority.startsWith(GROUP_PREFIX);
  }

  async getAuthorityAttributes(authority: string, attributes: AttributesType): Promise<any> {
    if (!authority) {
      return null;
    }

    const authorityRef = await this.getAuthorityRef(authority);

    if (Array.isArray(authorityRef)) {
      return null; // This shouldn't happen for a single authority, but we need to handle it for type safety
    }

    return Records.get(authorityRef).load(attributes);
  }

  async hasConfigWritePermission(recordId: string) {
    const isAdmin = await Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`).load('isAdmin?bool');

    if (isAdmin) {
      return true;
    }

    if (getEnabledWorkspaces()) {
      const isCurrentUserManager = await authorityApi.isManagerCurrentUser();

      if (isCurrentUserManager) {
        return true;
      }
    }

    const permission = await Records.get(recordId).load(PERMISSION_WRITE_ATTR, true);

    return permission;
  }
}
window.Citeck = window.Citeck || {};
window.Citeck.AuthorityService = new AuthorityService();

export default window.Citeck.AuthorityService;
