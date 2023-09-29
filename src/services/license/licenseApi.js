import Records from '../../components/Records/Records';
import { FLAG_DEVELOPER, FEATURES } from './licenseConstants';

const licenseAttributes = Records.get('uiserv/meta@').load({
  [FLAG_DEVELOPER]: '$license.' + FLAG_DEVELOPER + '?bool!',
  [FEATURES]: '$license.' + FEATURES + '?json!'
});

export async function getLicenseInfo() {
  return licenseAttributes;
}
