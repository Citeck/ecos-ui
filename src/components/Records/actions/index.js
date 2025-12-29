import actions from './actions';
import recordActions from './recordActions';

import { IS_TEST_ENV } from '@/helpers/util';

export default IS_TEST_ENV ? recordActions : actions;
export * from './types';
