import ComputedResolver from './ComputedResolver';

import Records from '../../../Records';
import lodash from 'lodash';
import { t } from '../../../../helpers/util';

export default class ScriptResolver extends ComputedResolver {
  static RESOLVER_ID = 'script';
  static RESOLVER_ALIASES = [''];

  async resolve(config) {
    if (!config.script) {
      throw new Error("Script is a mandatory parameter for computed parameter with type 'script'. Config: " + JSON.stringify(config));
    }
    return new Function('Records', 'lodash', 't', config.script)(Records, lodash, t);
  }
}
