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
