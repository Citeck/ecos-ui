import Records from '../../components/Records/Records';

const CONFIG_SOURCE_ID_PREFIX = 'uiserv/cfg@';

export async function loadConfigs(configsMap) {
  const result = {};
  const promisesList = [];
  for (let configKey in configsMap) {
    const promise = Records.get(CONFIG_SOURCE_ID_PREFIX + configKey).load(configsMap[configKey]);
    promisesList.push(promise.then(res => (result[configKey] = res)));
  }
  await Promise.all(promisesList);

  return result;
}

export async function saveConfig(configKey, value) {
  const rec = Records.get(CONFIG_SOURCE_ID_PREFIX + configKey);
  rec.att('value', value);
  return rec.save();
}
