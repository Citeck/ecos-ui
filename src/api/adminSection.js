import Records from '../components/Records';
import { SourcesId } from '../constants';

export class AdminSectionApi {
  getGroupSectionList = () => {
    return Records.query(
      {
        sourceId: SourcesId.ADMIN_PAGE_SECTION,
        language: 'groups'
      },
      {
        label: 'label',
        sections: 'sections[]{label,type,config?json}'
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
