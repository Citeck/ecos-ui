import ConfigService, { WORKSPACES_ALLOW_CREATE, DEFAULT_WORKSPACE } from '../ConfigService';
import { loadConfigs } from '../configApi';

jest.mock('../configApi', () => ({ loadConfigs: jest.fn(async () => ({})), saveConfig: jest.fn() }));
jest.mock('../../../helpers/util', () => ({ IS_TEST_ENV: false }));
jest.mock('../../../helpers/export/util', () => ({ getCurrentLocale: () => 'ru' }));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createService = () => new ConfigService.constructor();

beforeEach(async () => {
  await ConfigService.getValues();
  localStorage.clear();
  loadConfigs.mockReset();
  loadConfigs.mockResolvedValue({});
});

test('cold cache readers wait for one batch and receive the server value', async () => {
  const batch = deferred();
  loadConfigs.mockReturnValue(batch.promise);
  const service = createService();
  let settled = false;
  const first = service.getValue(WORKSPACES_ALLOW_CREATE).then(value => {
    settled = true;
    return value;
  });
  const second = service.getValue(WORKSPACES_ALLOW_CREATE);
  await Promise.resolve();
  expect(settled).toBe(false);
  expect(loadConfigs).toHaveBeenCalledTimes(1);
  batch.resolve({ [WORKSPACES_ALLOW_CREATE]: true });
  await expect(first).resolves.toBe(true);
  await expect(second).resolves.toBe(true);
  await expect(service.getValue(WORKSPACES_ALLOW_CREATE)).resolves.toBe(true);
  expect(loadConfigs).toHaveBeenCalledTimes(1);
});

test.each([false, null])('batch value %s preserves false or applies the default', async value => {
  loadConfigs.mockResolvedValue({ [WORKSPACES_ALLOW_CREATE]: value });
  const service = createService();
  await expect(service.getValue(WORKSPACES_ALLOW_CREATE)).resolves.toBe(false);
  expect(loadConfigs).toHaveBeenCalledTimes(1);
});

test('missing config uses its keyed response, including custom scalar props', async () => {
  const service = createService();
  await service.getValues();
  loadConfigs.mockResolvedValue({ custom: 42 });
  await expect(service.getValue('custom', { type: 'NUMBER' })).resolves.toBe(42);
  expect(loadConfigs).toHaveBeenLastCalledWith({ custom: 'value?num' });
  await expect(service.getValue('custom', { type: 'NUMBER' })).resolves.toBe(42);
  expect(loadConfigs).toHaveBeenCalledTimes(2);
});

test('a different attribute waits for the batch before loading its own value', async () => {
  const batch = deferred();
  loadConfigs.mockReturnValueOnce(batch.promise).mockResolvedValue({ [DEFAULT_WORKSPACE]: 7 });
  const service = createService();
  const value = service.getValue(DEFAULT_WORKSPACE, { type: 'NUMBER' });
  await Promise.resolve();
  expect(loadConfigs).toHaveBeenCalledTimes(1);
  batch.resolve({ [DEFAULT_WORKSPACE]: 'default' });
  await expect(value).resolves.toBe(7);
  expect(loadConfigs).toHaveBeenLastCalledWith({ [DEFAULT_WORKSPACE]: 'value?num' });
});

test('fresh cache returns immediately while a background batch is pending', async () => {
  const seed = createService();
  await seed.getValues();
  const values = { ...seed._values, [WORKSPACES_ALLOW_CREATE]: { 'value?bool': true } };
  localStorage.setItem('ecos-ui-config', JSON.stringify({ values, locale: 'ru', lastUpdateTime: Date.now() - 20000 }));
  const batch = deferred();
  loadConfigs.mockReturnValue(batch.promise);
  const service = createService();
  await expect(service.getValue(WORKSPACES_ALLOW_CREATE)).resolves.toBe(true);
  batch.resolve({ [WORKSPACES_ALLOW_CREATE]: false });
  await batch.promise;
  await Promise.resolve();
  await expect(service.getValue(WORKSPACES_ALLOW_CREATE)).resolves.toBe(false);
});

test.each(['expired', 'locale changed', 'key missing'])('%s cache waits for server refresh', async scenario => {
  const seed = createService();
  await seed.getValues();
  const values = { ...seed._values, [WORKSPACES_ALLOW_CREATE]: { 'value?bool': false } };
  if (scenario === 'key missing') delete values[DEFAULT_WORKSPACE];
  localStorage.setItem(
    'ecos-ui-config',
    JSON.stringify({
      values,
      locale: scenario === 'locale changed' ? 'en' : 'ru',
      lastUpdateTime: Date.now() - (scenario === 'expired' ? 1800001 : 0)
    })
  );
  const batch = deferred();
  loadConfigs.mockReturnValue(batch.promise);
  const service = createService();
  const value = service.getValue(WORKSPACES_ALLOW_CREATE);
  batch.resolve({ [WORKSPACES_ALLOW_CREATE]: true });
  await expect(value).resolves.toBe(true);
  expect(loadConfigs).toHaveBeenCalledTimes(2);
});
