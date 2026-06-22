import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';

export class AdminSectionApi {
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
    )
      .then(res => {
        if (res.errors && res.errors.length) {
          return Promise.reject(res.errors);
        }

        return res.records;
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };
}
