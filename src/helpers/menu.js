export function processCreateVariantsItems(sites) {
  let menuItems = [];

  // TODO add it to API response
  menuItems.push({
    id: 'HEADER_CREATE_WORKFLOW',
    label: 'header.create-workflow.label',
    items: [
      {
        id: 'HEADER_CREATE_WORKFLOW_ADHOC',
        label: 'header.create-workflow-adhoc.label',
        targetUrl: '/share/page/workflow-start-page?formType=workflowId&formKey=activiti$perform'
      },
      {
        id: 'HEADER_CREATE_WORKFLOW_CONFIRM',
        label: 'header.create-workflow-confirm.label',
        targetUrl: '/share/page/start-specified-workflow?workflowId=activiti$confirm'
      }
    ]
  });

  for (let site of sites) {
    let createVariants = [];
    for (let variant of site.createVariants) {
      // variant.isDefault
      if (!variant.canCreate) {
        continue;
      }
      createVariants.push({
        id: 'HEADER_' + (site.siteId + '_' + variant.type).replace(/-/g, '_').toUpperCase(),
        label: variant.title,
        targetUrl: '/share/page/node-create?type=' + variant.type + '&viewId=' + variant.formId + '&destination=' + variant.destination
      });
    }

    const siteId = 'HEADER_' + site.siteId.replace(/-/g, '_').toUpperCase();
    menuItems.push({
      id: siteId,
      label: site.siteTitle,
      items: createVariants
    });
  }

  return menuItems;
}

export const makeUserMenuItems = (userName, isAvailable, isMutable, isExternalAuthentication) => {
  const availability = 'make-' + (isAvailable === false ? '' : 'not') + 'available';

  let userMenuItems = [];

  userMenuItems.push(
    {
      id: 'HEADER_USER_MENU_MY_PROFILE',
      label: 'header.my-profile.label',
      targetUrl: '/share/page/user/' + encodeURIComponent(userName) + '/profile'
    },
    {
      id: 'HEADER_USER_MENU_AVAILABILITY',
      label: 'header.' + availability + '.label',
      targetUrl: '/share/page/components/deputy/make-available?available=' + (isAvailable === false ? 'true' : 'false'),
      control:
        isAvailable === false
          ? null
          : {
              type: 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE',
              payload: {
                targetUrl: '/share/page/components/deputy/make-available?available=' + (isAvailable === false ? 'true' : 'false')
              }
            }
    }
  );

  if (isMutable) {
    userMenuItems.push({
      id: 'HEADER_USER_MENU_PASSWORD',
      label: 'header.change-password.label',
      targetUrl: '/share/page/user/' + encodeURIComponent(userName) + '/change-password'
    });
  }

  userMenuItems.push(
    {
      id: 'HEADER_USER_MENU_FEEDBACK',
      label: 'header.feedback.label',
      targetUrl: 'https://www.citeck.ru/feedback',
      targetUrlType: 'FULL_PATH',
      target: '_blank'
    },
    {
      id: 'HEADER_USER_MENU_REPORTISSUE',
      label: 'header.reportIssue.label',
      targetUrl:
        'mailto:support@citeck.ru?subject=Ошибка в работе Citeck EcoS: краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность действий, которая привела к ней. При необходимости приложите скриншоты.',
      targetUrlType: 'FULL_PATH',
      target: '_blank'
    }
  );

  if (!isExternalAuthentication) {
    userMenuItems.push({
      id: 'HEADER_USER_MENU_LOGOUT',
      label: 'header.logout.label',
      control: {
        type: 'ALF_DOLOGOUT'
      }
    });
  }

  return userMenuItems;
};

export function processMenuItemsFromOldMenu(oldMenuItems) {
  let siteMenuItems = [];

  for (let item of oldMenuItems) {
    if (!item.config) {
      continue;
    }

    let newItem = {
      id: item.id,
      label: item.config.label
    };

    if (item.config.targetUrl) {
      if (item.config.targetUrlType && item.config.targetUrlType === 'FULL_PATH') {
        newItem.targetUrl = item.config.targetUrl;
      } else {
        newItem.targetUrl = '/share/page/' + item.config.targetUrl;
      }

      if (item.config.targetUrlLocation && item.config.targetUrlLocation === 'NEW') {
        newItem.target = '_blank';
      }
    }

    if (item.config.publishTopic) {
      newItem.control = {
        type: item.config.publishTopic
      };
      if (item.config.publishPayload) {
        newItem.control.payload = item.config.publishPayload;
      }
    }

    siteMenuItems.push(newItem);
  }

  return siteMenuItems;
}

export function makeSiteMenu() {
  return [
    {
      id: 'HOME_PAGE',
      label: 'Домашняя страница',
      targetUrl: '/v2/dashboard',
      targetUrlType: 'FULL_PATH'
    },
    {
      id: 'SETTINGS_HOME_PAGE',
      label: 'Настроить домашнюю страницу',
      targetUrl: '/v2/dashboard/settings',
      targetUrlType: 'FULL_PATH'
    },
    {
      id: 'GO_ADMIN_PAGE',
      label: 'Перейти в раздел администратора',
      targetUrl: '/v2/designer',
      targetUrlType: 'FULL_PATH'
    }
  ];
}
