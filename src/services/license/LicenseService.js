import { getLicenseInfo } from './licenseApi';
import { FLAG_DEVELOPER, FEATURES, LICENSE_FEATURE_AI } from './licenseConstants';

class LicenseService {
  async hasAiFeature() {
    return this.hasFeature(LICENSE_FEATURE_AI);
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
