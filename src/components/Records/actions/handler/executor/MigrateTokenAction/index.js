import Mock from './Mock';
import MigrateTokenAction from './MigrateTokenAction';
import { IS_TEST_ENV } from '../../../../../../helpers/util';

export default IS_TEST_ENV ? Mock : MigrateTokenAction;
