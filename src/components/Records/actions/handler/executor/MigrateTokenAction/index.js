import { IS_TEST_ENV } from '../../../../../../helpers/util';

import MigrateTokenAction from './MigrateTokenAction';
import Mock from './Mock';

export default IS_TEST_ENV ? Mock : MigrateTokenAction;
