export const fakeApi = {
  validateUser: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          payload: {
            fullName: 'Administrator',
            nodeRef: 'workspace://SpacesStore/a6ce05f5-bd4b-4196-a12f-a5601a2fa0cd',
            isAvailable: true,
            isMutable: true
          }
        });
      }, 0);
    });
  },

  getIsCascadeCreateVariantMenu: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });
  },

  getIsExternalAuthentication: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(false);
      }, 0);
    });
  },

  getSiteMenuItems: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        const items = [
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_DASHBOARD',
            config: { id: 'HEADER_SITE_DASHBOARD', label: 'Главная страница сайта', targetUrl: 'site/contracts/dashboard', selected: false }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_DOCUMENTLIBRARY',
            config: {
              id: 'HEADER_SITE_DOCUMENTLIBRARY',
              label: 'Каталог',
              pageId: 'documentlibrary',
              targetUrl: 'site/contracts/documentlibrary',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_JOURNALS',
            config: {
              id: 'HEADER_SITE_JOURNALS',
              label: 'Журналы',
              pageId: 'journals',
              targetUrl: 'site/contracts/journals2/list/main',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_SITE-DOCUMENT-TYPES',
            config: {
              id: 'HEADER_SITE_SITE-DOCUMENT-TYPES',
              label: 'Управление типами кейсов на сайте',
              pageId: 'site-document-types',
              targetUrl: 'site/contracts/site-document-types',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_MEMBERS',
            config: { id: 'HEADER_SITE_MEMBERS', label: 'Участники сайта', targetUrl: 'site/contracts/site-members', selected: false }
          },
          {
            name: 'js/citeck/header/citeckMenuItem',
            id: 'HEADER_SITE_INVITE',
            config: {
              iconAltText: 'Добавление пользователей',
              id: 'HEADER_SITE_INVITE',
              label: 'Добавление пользователей',
              title: 'Добавление пользователей',
              targetUrl: 'site/contracts/add-users',
              iconClass: 'alf-user-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_CUSTOMIZE_SITE_DASHBOARD',
            config: {
              id: 'HEADER_CUSTOMIZE_SITE_DASHBOARD',
              label: 'customize_dashboard.label',
              targetUrl: 'site/contracts/customise-site-dashboard',
              iconClass: 'alf-cog-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_EDIT_SITE_DETAILS',
            config: {
              id: 'HEADER_EDIT_SITE_DETAILS',
              label: 'edit_site_details.label',
              publishPayload: { userFullName: 'Ivan Tkachenko', site: 'contracts', user: 'admin', siteTitle: 'Договоры' },
              iconClass: 'alf-edit-icon',
              publishTopic: 'ALF_EDIT_SITE'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_CUSTOMIZE_SITE',
            config: {
              id: 'HEADER_CUSTOMIZE_SITE',
              label: 'customize_site.label',
              targetUrl: 'site/contracts/customise-site',
              iconClass: 'alf-cog-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_LEAVE_SITE',
            config: {
              id: 'HEADER_LEAVE_SITE',
              label: 'leave_site.label',
              publishPayload: { userFullName: 'Ivan Tkachenko', site: 'contracts', user: 'admin', siteTitle: 'Договоры' },
              iconClass: 'alf-leave-icon',
              publishTopic: 'ALF_LEAVE_SITE'
            }
          }
        ];
        resolve(items);
      }, 0);
    });
  }
};
