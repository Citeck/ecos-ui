import { KEY_FIELDS } from './cmmn';

export const LOCAL_STORAGE_KEY_PAGE_POSITION = 'DmnPagePosition';
export const LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME = 'DmnRefererPagePathName';

export const EDITOR_PAGE_CONTEXT = '/share/page/dmn-editor/';

export const DMN_DEFINITIONS = 'dmn:Definitions';

export const DMN_KEY_FIELDS = [...KEY_FIELDS, 'versionTag'];

export const PERMISSION_DMN_DEPLOY_PROCESS = 'permissions._has.dmn-def-deploy?bool!true';

export const PERMISSION_DMN_INSTANCE_EDIT = 'permissions._has.dmn-instance-edit?bool';

export const PERMISSION_DMN_SECTION_CREATE_SUBSECTION = 'permissions._has.dmn-section-create-subsection?bool';
export const PERMISSION_DMN_SECTION_CREATE_DEF = 'permissions._has.dmn-section-create-dmn-def?bool';
export const PERMISSION_DMN_SECTION_EDIT_DEF = 'permissions._has.dmn-section-edit-dmn-def?bool';
