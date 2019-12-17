import Records from '../components/Records';
import { RecordService } from './recordService';

export class PropertiesApi extends RecordService {
  getFormList = function*({ record }) {
    const result = yield Records.get(record)
      .load({ keys: '_formKey[]?str' })
      .then(res => res);
    const { keys } = result;
    const formKeys = Array.from(keys || []);

    return yield Records.query({ sourceId: 'uiserv/eform', query: { formKeys } }).then(res => res);
  };
}
