import actions from './actions';
import recordActions from './recordActions';

import { IS_TEST_ENV } from '@/helpers/util.js';

export default IS_TEST_ENV ? recordActions : actions;
