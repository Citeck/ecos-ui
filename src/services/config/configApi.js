import Records from '../../components/Records/Records';

const META_RECORD = 'uiserv/meta@';
const CONFIG_SOURCE_ID_PREFIX = 'uiserv/cfg@';

export async function loadConfigs(configsMap) {
  const attributesToLoad = {};

  for (let configKey in configsMap) {
    const innerValue = configsMap[configKey].substring('value'.length);
    attributesToLoad[configKey] = '$cfg.' + configKey + innerValue;
  }
  return Records.get(META_RECORD).load(attributesToLoad);
}

export async function saveConfig(configKey, value) {
  const rec = Records.get(CONFIG_SOURCE_ID_PREFIX + configKey);
  rec.att('value', value);
  return rec.save();
}
