import ComputedResolver from './ComputedResolver';
import journalsServiceApi from '../../journalsServiceApi';

export default class QueryResolver extends ComputedResolver {
  static RESOLVER_ID = 'query';

  async resolve(config) {
    const attributes = config.attributes;
    let result;
    if (!attributes) {
      result = journalsServiceApi.queryData(config.query);
    } else {
      result = journalsServiceApi.queryData(config.query, attributes);
    }
    return result
      .then(res => res.records)
      .catch(e => {
        console.error('Computed query error', e, config);
        return [];
      });
  }
}
