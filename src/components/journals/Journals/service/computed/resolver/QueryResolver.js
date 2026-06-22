import ComputedResolver from './ComputedResolver';
import journalsServiceApi from '../../journalsServiceApi';

export default class QueryResolver extends ComputedResolver {
  static RESOLVER_ID = 'query';

  async resolve(config) {
    const attributes = config.attributes;
    let result;
    const query = {
      ...config.query
    };
    if (query.language == null) {
      query.language = 'predicate';
    }
    if (query.page == null) {
      query.page = { maxItems: 100 };
    }
    if (!attributes) {
      result = journalsServiceApi.queryData(query);
    } else {
      result = journalsServiceApi.queryData(query, attributes);
    }
    return result
      .then(res => res.records)
      .catch(e => {
        console.error('Computed query error', e, config);
        return [];
      });
  }
}
