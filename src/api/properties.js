import Records from '../components/Records';
import { SourcesId } from '../constants';

export class PropertiesApi {
  static isDraftStatus = async record => {
    return Records.get(record).load('invariants:isDraft?bool', true);
  };

  getFormList = async function({ record }) {
    const typeRef = await Records.get(record).load('_etype?id');

    return await Records.query(
      {
        sourceId: SourcesId.EFORM,
        language: 'forms-for-type',
        query: { typeRef }
      },
      ['title']
    ).then(response => response);
  };
}
