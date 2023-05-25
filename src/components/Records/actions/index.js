import { IS_TEST_ENV } from '../../../helpers/util';

let moduleExports;

if (IS_TEST_ENV) {
  moduleExports = require('./recordActions').default;
} else {
  moduleExports = require('./actions').default;
}

export default moduleExports;
