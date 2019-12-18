import Records from '../components/Records';
import { RecordService } from './recordService';

//import { SourcesId } from "../constants";

export class PropertiesApi extends RecordService {
  getFormList = function*({ record }) {
    const result = yield Records.get(record)
      .load('_formKey[]?str')
      .then(res => res);
    const { keys } = result;
    const formKeys = Array.from(keys || []);
    return {
      errors: [],
      hasMore: false,
      records: [
        {
          id: 'uiserv/eform@123',
          title: 'Form 0'
        },
        {
          id: 'uiserv/eform@456',
          title: 'Form 1'
        },
        {
          id: 'uiserv/eform@789',
          title: 'Form 2'
        }
      ],
      totalCount: 3
    };
    // return yield Records.query({ sourceId: SourcesId.EFORM, query: { formKeys } }, {
    //   id: 'id',
    //   title: 'title'
    // }).then(res => res);
  };
}
