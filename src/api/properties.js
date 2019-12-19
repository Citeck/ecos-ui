import { SourcesId } from '../constants';
import Records from '../components/Records';
import { RecordService } from './recordService';

export class PropertiesApi extends RecordService {
  getFormList = function*({ record }) {
    const formKeys = yield Records.get(record)
      .load('_formKey[]?str')
      .then(res => res || []);

    return yield Records.query(
      { sourceId: SourcesId.EFORM, query: { formKeys } },
      {
        id: 'id',
        title: 'title'
      }
    ).then(res => res);
  };
}
