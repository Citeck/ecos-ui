import ComputedResolver from './ComputedResolver';

import Records from '../../../../Records';
import lodash from 'lodash';
import { t } from '../../../../../helpers/util';

/**
 * config: {
 *   script: String,
 *   vars: {
 *     "var0": "abc"
 *     "var1": 123
 *   }
 * }
 */
export default class ScriptResolver extends ComputedResolver {
  static RESOLVER_ID = 'script';

  async resolve(config) {
    if (!config.script) {
      throw new Error("Script is a mandatory parameter for computed parameter with type 'script'. Config: " + JSON.stringify(config));
    }
    const vars = config.vars || {};
    /* eslint-disable-next-line */
    return new Function('Records', '_', 't', 'vars', config.script)(Records, lodash, t, vars);
  }
}
