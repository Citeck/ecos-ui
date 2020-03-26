import Records from '../components/Records';
import { RecordService } from './recordService';
import { SourcesId, QueryLanguage, QueryEntityKeys } from '../constants';

export class PropertiesApi extends RecordService {
  getFormList = function*({ record }) {
    const typeRef = yield Records.get(record).load('_etype?id');

    return yield Records.query(
      {
        sourceId: SourcesId.EFORM,
        language: QueryLanguage.FORMS_FOR_TYPE,
        query: { typeRef }
      },
      [QueryEntityKeys.TITLE]
    ).then(response => response);
  };
}
