import logger from '../logger';
import { getLicenseInfo } from './licenseApi';

import { LICENSE_FEATURE_GROUP_ACTIONS, FLAG_DEVELOPER, FEATURES } from './licenseConstants';

class LicenseService {
  async hasGroupActionsFeature() {
    return this.hasFeature(LICENSE_FEATURE_GROUP_ACTIONS);
  }

  async hasFeature(feature) {
    return getLicenseInfo()
      .then(r => r[FLAG_DEV] === true || !!r[FEATURES][feature])
      .catch(error => {
        logger.error("[LicenseService] Feature flag loading error. Feature: '" + feature + "'", error);
        return false;
      });
  }
}

window.Citeck.LicenseService = new LicenseService();
export default window.Citeck.LicenseService;
