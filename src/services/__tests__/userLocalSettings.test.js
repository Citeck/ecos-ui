import set from 'lodash/set';
import UserLocalSettingsService from '../userLocalSettings';
import { LocalStorageMock } from '../../__mocks__/storage.mock';

const USERNAME = 'test-user-name';
const DATA = { test1: 'test1', test2: 'test2' };
const KEY = 'test-key';

describe('User Local Settings Service', () => {
  delete window.localStorage;
  window.localStorage = new LocalStorageMock(jest);
  set(window, 'Alfresco.constants.USERNAME', USERNAME);

  beforeEach(window.localStorage.clear);

  it('Method getMenuKey', () => {
    expect(UserLocalSettingsService.getMenuKey()).toEqual('menuSettings_' + USERNAME);
  });

  describe.each([
    ['key', undefined, 'ecos-ui-dashlet-settings_id-key/user-' + USERNAME],
    ['key', 'tab-555', 'ecos-ui-dashlet-settings_id-key/tab-555/user-' + USERNAME]
  ])('Method getDashletKey', (key, tabId, output) => {
    it(`getDashletKey key=${key} tab=${tabId} returns ${output}`, () => {
      expect(UserLocalSettingsService.getDashletKey(key, tabId)).toEqual(output);
    });
  });

  describe.each([
    ['key', 'ecos-ui-journal-settings_id-key/user-' + USERNAME],
    [undefined, 'ecos-ui-journal-settings_id-all/user-' + USERNAME],
    ['', 'ecos-ui-journal-settings_id-all/user-' + USERNAME]
  ])('Method getDashletKey', (key, output) => {
    it(`getDashletKey key=${key} returns ${output}`, () => {
      expect(UserLocalSettingsService.getJournalKey(key)).toEqual(output);
    });
  });

  describe('Menu settings', () => {
    it(`getMenuMode & setMenuMode`, () => {
      const settingsBefore = UserLocalSettingsService.getMenuMode();
      expect(settingsBefore).toBeNull();
      UserLocalSettingsService.setMenuMode(DATA);
      const settingsAfter = UserLocalSettingsService.getMenuMode();
      expect(settingsAfter).toEqual(DATA);
    });
  });

  describe('Journal settings', () => {
    it(`ALL > getJournalAllProps & setJournalProperty`, () => {
      const settingsBefore = UserLocalSettingsService.getJournalAllProps(KEY);
      expect(settingsBefore).toEqual({});
      UserLocalSettingsService.setJournalProperty(KEY, DATA);
      const settingsAfter = UserLocalSettingsService.getJournalAllProps(KEY);
      expect(settingsAfter).toEqual(DATA);
    });

    it(`Existent prop > getJournalProperty & setJournalProperty`, () => {
      const settingsBefore = UserLocalSettingsService.getJournalProperty(KEY, 'test1');
      expect(settingsBefore).toBeUndefined();
      UserLocalSettingsService.setJournalProperty(KEY, DATA);
      const settingsAfter = UserLocalSettingsService.getJournalProperty(KEY, 'test1');
      expect(settingsAfter).toEqual(DATA.test1);
    });

    it(`Nonexistent prop > getJournalProperty & setJournalProperty`, () => {
      const settingsBefore = UserLocalSettingsService.getJournalProperty(KEY, 'Nonexistent');
      expect(settingsBefore).toBeUndefined();
      UserLocalSettingsService.setJournalProperty(KEY, DATA);
      const settingsAfter = UserLocalSettingsService.getJournalProperty(KEY, 'Nonexistent');
      expect(settingsAfter).toBeUndefined;
    });
  });

  describe('Dashlet settings', () => {
    it(`Existent prop > getDashletProperty & setDashletProperty`, () => {
      const settingsBefore = UserLocalSettingsService.getDashletProperty(KEY, 'test1');
      expect(settingsBefore).toBeUndefined();
      UserLocalSettingsService.setDashletProperty(KEY, DATA);
      const settingsAfter = UserLocalSettingsService.getDashletProperty(KEY, 'test1');
      expect(settingsAfter).toEqual(DATA.test1);
    });

    it(`Nonexistent prop > getDashletProperty & setDashletProperty`, () => {
      const settingsBefore = UserLocalSettingsService.getDashletProperty(KEY, 'Nonexistent');
      expect(settingsBefore).toBeUndefined();
      UserLocalSettingsService.setDashletProperty(KEY, DATA);
      const settingsAfter = UserLocalSettingsService.getDashletProperty(KEY, 'Nonexistent');
      expect(settingsAfter).toBeUndefined();
    });
  });
});
