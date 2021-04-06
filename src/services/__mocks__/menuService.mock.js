export const LINK_CONFIGS = [
  {
    id: 'SETTINGS_DASHBOARD',
    label: 'header.site-menu.page-settings',
    targetUrl: '/v2/dashboard/settings',
    targetUrlType: 'FULL_PATH'
  },
  {
    id: 'GO_ADMIN_PAGE',
    label: 'header.site-menu.admin-page',
    targetUrl: '/v2/admin',
    targetUrlType: 'FULL_PATH'
  }
];

export const LINKS_BY_CONFIG = [
  [
    LINK_CONFIGS[0],
    '/v2/dashboard/settings?dashboardId=user-base-type-dashboard&recordRef=workspace://SpacesStore/f43fb8cc-d700-4a1b-9f6d-1a18beb069df'
  ],
  [LINK_CONFIGS[1], '/v2/admin?']
];
