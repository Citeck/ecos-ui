import ComputedResolver from './ComputedResolver';
import journalsServiceApi from '../../journalsServiceApi';
import Records from '../../../../Records/Records';
import { SourcesId } from '../../../../../constants';

export default class TypeRecordsResolver extends ComputedResolver {
  static RESOLVER_ID = 'type-records';

  async resolve(config) {
    let typeId = config.typeId;
    if (!typeId) {
      return [];
    }
    const attributes = config.attributes;
    const sourceIdDelimIdx = typeId.indexOf('@');
    let maxItems = config.maxItems;
    if (maxItems == null) {
      maxItems = 100;
    }

    if (sourceIdDelimIdx > -1) {
      typeId = typeId.substring(sourceIdDelimIdx + 1);
    }
    const typeRef = SourcesId.RESOLVED_TYPE + '@' + typeId;

    const sourceId = await Records.get(typeRef).load('sourceId');

    const query = {
      sourceId,
      query: {
        t: 'eq',
        a: '_type',
        v: SourcesId.TYPE + '@' + typeId
      },
      language: 'predicate',
      page: {
        maxItems
      }
    };

    let result;
    if (!attributes) {
      result = journalsServiceApi.queryData(query);
    } else {
      result = journalsServiceApi.queryData(query, attributes);
    }
    return result
      .then(res => res.records)
      .catch(e => {
        console.error('Computed type records error', e, config);
        return [];
      });
  }
}
