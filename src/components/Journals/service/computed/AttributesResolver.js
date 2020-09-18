import ComputedResolver from './ComputedResolver';

import lodash from 'lodash';

import journalsServiceApi from '../journalsServiceApi';

export default class AttributesResolver extends ComputedResolver {
  static RESOLVER_ID = 'attributes';

  async resolve(config) {
    if (!config.record || !config.attributes) {
      throw new Error('Record and attributes is a mandatory parameter. Config: ' + JSON.stringify(config));
    }

    let result;
    if (lodash.isString(config.attributes)) {
      const isMultiple = config.attributes.indexOf('[]') >= 0 || config.attributes.indexOf('atts(') >= 0;
      result = journalsServiceApi.loadAttributes(config.record, config.attributes).catch(e => {
        console.error("Attributes can't be loaded", e, config);
        return isMultiple ? [] : null;
      });
    } else {
      result = journalsServiceApi.loadAttributes(config.record, config.attributes).catch(e => {
        console.error("Attributes can't be loaded", e, config);
        return {};
      });
    }
    return result;
  }
}
