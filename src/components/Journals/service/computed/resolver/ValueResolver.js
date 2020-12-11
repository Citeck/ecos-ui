import ComputedResolver from './ComputedResolver';

import _ from 'lodash';

/**
 * config: {
 *   script: String,
 *   vars: {
 *     "var0": "abc"
 *     "var1": 123
 *   }
 * }
 */
export default class ValueResolver extends ComputedResolver {
  static RESOLVER_ID = 'value';

  async resolve(config) {
    if (!config.value) {
      return null;
    }
    if (!_.isString(config.value)) {
      return config.value;
    }

    if (config.value === 'true') {
      return true;
    }
    if (config.value === 'false') {
      return false;
    }

    let number = +config.value;
    if (!Number.isNaN(number)) {
      return number;
    }

    return config.value;
  }
}
