import Records from '../components/Records';
import { SourcesId } from '../constants';
import { RecordService } from './recordService';

export class PropertiesApi extends RecordService {
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
