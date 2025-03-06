import { IS_TEST_ENV } from '../../../helpers/util';
import recordActions from './recordActions';
import actions from './actions';

/*let moduleExports;

if (IS_TEST_ENV) {
  moduleExports = require('./recordActions').default;
} else {
  moduleExports = require('./actions').default;
}*/

export default (IS_TEST_ENV ? recordActions : actions);
