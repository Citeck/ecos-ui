import { IS_TEST_ENV } from '../../../helpers/util';
import BaseEcosFormUtils from './BaseEcosFormUtils';
import EcosFormUtils from './EcosFormUtils';

export default IS_TEST_ENV ? BaseEcosFormUtils : EcosFormUtils;
