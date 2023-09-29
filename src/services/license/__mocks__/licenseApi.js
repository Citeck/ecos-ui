import { FLAG_DEVELOPER, FEATURES, LICENSE_FEATURE_GROUP_ACTIONS } from '../licenseConstants';

export async function getLicenseInfo() {
  return {
    [FLAG_DEVELOPER]: true,
    [FEATURES]: {
      [LICENSE_FEATURE_GROUP_ACTIONS]: {}
    }
  };
}
