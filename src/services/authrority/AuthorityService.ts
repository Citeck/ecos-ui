import isString from 'lodash/isString';

import * as authorityApi from './authorityApi';

import Records from '@/components/Records/Records';
import { PERMISSION_WRITE_ATTR } from '@/components/Records/constants';
import { AttributesType } from '@/components/Records/types';
import { SourcesId } from '@/constants';
import { getCurrentUserName, getEnabledWorkspaces } from '@/helpers/util';

const GROUP_PREFIX = 'GROUP_';

const PERSON_SOURCE_ID = SourcesId.PERSON;
const GROUPS_SOURCE_ID = SourcesId.GROUP;

const ALFRESCO_PREFIX = 'alfresco/@';
const ALFRESCO_WORKSPACE_SPACES_STORE = 'workspace://SpacesStore/';

export const ArtifactEditPerms = {
  COPY: 'COPY',
  EDIT: 'EDIT',
  NONE: 'NONE'
}

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

  async getAuthorityRef(authority: string | string[]): Promise<any> {
    if (!authority) {
      return '';
    }
    if (Array.isArray(authority)) {
      return Promise.all(authority.map(a => this.getAuthorityRef(a))) as Promise<string[]>;
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
    if (Array.isArray(authority) && authority.length === 0) {
      return [];
    }
    return Records.get(await this.getAuthorityRef(authority)).load(attributes);
  }

  async getArtifactPerms(recordId: string): Promise<string> {
    if (!recordId) {
      return ArtifactEditPerms.NONE
    }
    const isAdmin = await this.isCurrentUserAdmin()
    if (recordId.includes('type$')) {
      if (isAdmin || await this.isCurrentUserManagerOfCurrentWs()) {
        return ArtifactEditPerms.COPY;
      } else {
        return ArtifactEditPerms.NONE;
      }
    }
    if (isAdmin) {
      return ArtifactEditPerms.EDIT;
    }
    const recAtts = await Records.get(recordId).load({
      'canWrite': PERMISSION_WRITE_ATTR,
      'isSystem': 'system?bool!'
    }, true)

    if (recAtts['canWrite']) {
      return ArtifactEditPerms.EDIT;
    }
    if (recAtts['isSystem']) {
      return ArtifactEditPerms.NONE;
    }
    if (await this.isCurrentUserManagerOfCurrentWs()) {
      return ArtifactEditPerms.COPY;
    }
    return ArtifactEditPerms.NONE;
  }

  async hasConfigWritePermission(recordId: string, params?: { toCheckGenerateForm?: boolean }) {
    const { toCheckGenerateForm } = params || {};
    if (toCheckGenerateForm && recordId && recordId.includes('type$')) {
      return false;
    }

    const isAdmin = await this.isCurrentUserAdmin();

    if (isAdmin) {
      return true;
    }

    if (await this.isCurrentUserManagerOfCurrentWs()) {
      return true;
    }

    return Records.get(recordId).load(PERMISSION_WRITE_ATTR, true);
  }

  private async isCurrentUserAdmin(): Promise<boolean> {
    return Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`).load('isAdmin?bool');
  }

  private async isCurrentUserManagerOfCurrentWs(): Promise<boolean> {
    if (!getEnabledWorkspaces()) {
      return false
    }
    return authorityApi.isManagerCurrentUser();
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.AuthorityService = new AuthorityService();

export default window.Citeck.AuthorityService;
