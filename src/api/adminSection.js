import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';

export class AdminSectionApi {
  // COREDEV-466: a failure must reach the caller (the saga shows the server text);
  // swallowing it here rendered a silently empty admin menu.
  getGroupSectionList = () => {
    return Records.query(
      {
        sourceId: SourcesId.ADMIN_PAGE_SECTION,
        language: 'groups'
      },
      {
        label: 'label',
        sections: 'sections[]{label,type,shortName,config?json}'
      }
    ).then(res => res.records);
  };
}
