import { IS_TEST_ENV } from '../../../../../../helpers/util';

let Action;

if (IS_TEST_ENV) {
  Action = require('./Mock');
} else {
  Action = require('./MigrateTokenAction');
}

export default Action.default;
