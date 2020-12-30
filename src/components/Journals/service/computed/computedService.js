import computedResolversRegistry from './resolver';
import _ from 'lodash';
import { replacePlaceholders } from '../util';

class ComputedService {
  async resolve(computedParams, parameters) {
    if (!computedParams || !computedParams.length) {
      return {};
    }

    const computedResult = await Promise.all(
      computedParams.map(it => {
        if (!it.id) {
          console.error('Computed without id', it);
          return null;
        }
        let config = it.config;
        if (parameters && _.size(parameters) > 0) {
          config = replacePlaceholders(config, parameters);
        }
        let resolver = computedResolversRegistry.getResolver(it.type);
        return resolver
          .resolve(config || {})
          .catch(e => {
            console.error('Computed parameter error', e, it);
            return null;
          })
          .then(value => ({
            id: it.id,
            value
          }));
      })
    );

    const computedResMap = {};
    for (let computed of computedResult) {
      if (computed) {
        computedResMap[computed.id] = computed.value;
      }
    }

    return computedResMap;
  }
}

export default new ComputedService();
