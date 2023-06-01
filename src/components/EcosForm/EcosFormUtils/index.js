import { IS_TEST_ENV } from '../../../helpers/util';

let EcosFormUtils;

if (IS_TEST_ENV) {
  EcosFormUtils = require('./BaseEcosFormUtils');
} else {
  EcosFormUtils = require('./EcosFormUtils');
}

export default EcosFormUtils.default;
