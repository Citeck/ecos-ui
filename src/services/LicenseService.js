import Records from '../components/Records';
import logger from '../services/logger';
import { IS_TEST_ENV } from '../helpers/util';

export const LICENSE_FEATURE_GROUP_ACTIONS = 'group-actions';

const FLAG_DEV = 'isDevLicense';
const FEATURES = 'features';

const licenseAttributes = Records.get('uiserv/meta@').load({
  [FLAG_DEV]: '$license.developer?bool!',
  [FEATURES]: '$license.features?json!'
});

class LicenseService {
  async hasGroupActionsFeature() {
    return this.hasFeature(LICENSE_FEATURE_GROUP_ACTIONS);
  }

  async hasFeature(feature) {
    if (IS_TEST_ENV) {
      return true;
    }
    return licenseAttributes
      .then(r => r[FLAG_DEV] === true || !!r.features[feature])
      .catch(error => {
        logger.error("[LicenseService] Feature flag loading error. Feature: '" + feature + "'", error);
        return false;
      });
  }
}

window.Citeck.LicenseService = new LicenseService();
export default window.Citeck.LicenseService;
