import { getLicenseInfo } from './licenseApi';
import { LICENSE_FEATURE_GROUP_ACTIONS, FLAG_DEVELOPER, FEATURES, LICENSE_FEATURE_IMPORT_DATA } from './licenseConstants';

class LicenseService {
  async hasGroupActionsFeature() {
    return this.hasFeature(LICENSE_FEATURE_GROUP_ACTIONS);
  }

  async hasImportDataFeature() {
    return this.hasFeature(LICENSE_FEATURE_IMPORT_DATA);
  }

  async hasFeature(feature) {
    return getLicenseInfo()
      .then(r => r[FLAG_DEVELOPER] === true || !!r[FEATURES][feature])
      .catch(error => {
        console.error("[LicenseService] Feature flag loading error. Feature: '" + feature + "'", error);
        return false;
      });
  }
}

window.Citeck.LicenseService = new LicenseService();
export default window.Citeck.LicenseService;
